import hashlib
import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import func
from sqlalchemy.orm import Session

from db_dependencies import Db
from persistence.admin import AdminPersistence
from persistence.domains import UserDomainsPersistence
from resolver import injectable
from schemas.admin import PartnersQueryParams
from schemas.users import UpdateUserRequest
from enums import (
    UserAuthorizationStatus,
    UpdateUserStatus,
    SendgridTemplate,
    AdminStatus,
)
from models.plans import SubscriptionPlan
from models.subscriptions import UserSubscriptions
from models.users import Users
from persistence.plans_persistence import PlansPersistence
from persistence.sendgrid_persistence import SendgridPersistence
from persistence.user_persistence import UserPersistence
from persistence.audience_dashboard import DashboardAudiencePersistence
from services.integrations.base import IntegrationService
from services.jwt_service import create_access_token
from services.sendgrid import SendgridHandler
from services.subscriptions import SubscriptionService
from services.user_subscriptions import UserSubscriptionsService
from services.users_auth import UsersAuth
from utils import get_md5_hash
from utils import get_utc_aware_date
from persistence.partners_persistence import PartnersPersistence

logger = logging.getLogger(__name__)


@injectable
class AdminCustomersService:
    def __init__(
        self,
        db: Db,
        user_subscription_service: UserSubscriptionsService,
        subscription_service: SubscriptionService,
        user_persistence: UserPersistence,
        plans_persistence: PlansPersistence,
        users_auth_service: UsersAuth,
        send_grid_persistence: SendgridPersistence,
        partners_persistence: PartnersPersistence,
        dashboard_audience_persistence: DashboardAudiencePersistence,
        admin_persistence: AdminPersistence,
        domain_persistence: UserDomainsPersistence,
        integration_service: IntegrationService,
    ):
        self.db = db
        self.user_subscription_service = user_subscription_service
        self.subscription_service = subscription_service
        self.user_persistence = user_persistence
        self.plans_persistence = plans_persistence
        self.users_auth_service = users_auth_service
        self.send_grid_persistence = send_grid_persistence
        self.partners_persistence = partners_persistence
        self.dashboard_audience_persistence = dashboard_audience_persistence
        self.admin_persistence = admin_persistence
        self.domain_persistence = domain_persistence
        self.integration_service = integration_service

    def get_admin_users(
        self,
        *,
        search_query: str,
        page: int,
        per_page: int,
        sort_by: str,
        sort_order: str,
        last_login_date_start: int,
        last_login_date_end: int,
        join_date_start: int,
        join_date_end: int,
    ):
        admin_users = self.user_persistence.get_admin_users(
            search_query=search_query,
            last_login_date_start=last_login_date_start,
            last_login_date_end=last_login_date_end,
            join_date_start=join_date_start,
            join_date_end=join_date_end,
        )
        invitations_admin = (
            self.admin_persistence.get_pending_invitations_admin(
                search_query=search_query,
                join_date_start=join_date_start,
                join_date_end=join_date_end,
            )
            if not last_login_date_start
            else []
        )

        users_dict = [
            {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "created_at": user.created_at,
                "last_login": user.last_login,
                "invited_by_email": user.invited_by_email,
                "role": user.role,
                "type": "user",
            }
            for user in admin_users
        ]

        invitations_admin_dicts = [
            {
                "id": inv.id,
                "email": inv.email,
                "full_name": inv.full_name,
                "created_at": inv.created_at,
                "last_login": None,
                "invited_by_email": inv.invited_by_email,
                "role": None,
                "type": "invitation",
            }
            for inv in invitations_admin
        ]

        combined = users_dict + invitations_admin_dicts

        def normalize_sort_value(value):
            if isinstance(value, datetime):
                return value
            if isinstance(value, int):
                return datetime.fromtimestamp(value)
            return datetime.min

        sort_key_mapping = {
            "id": "id",
            "join_date": "created_at",
            "last_login_date": "last_login",
        }

        sort_key = sort_key_mapping.get(sort_by, "created_at")
        reverse_order = sort_order == "desc"

        combined.sort(
            key=lambda x: normalize_sort_value(x.get(sort_key)),
            reverse=reverse_order,
        )

        start = (page - 1) * per_page
        end = start + per_page
        paginated = combined[start:end]

        return {"users": paginated, "count": len(combined)}

    def get_customer_accounts(
        self,
        *,
        search_query: str,
        page: int,
        per_page: int,
        sort_by: str,
        sort_order: str,
        exclude_test_users: bool,
        last_login_date_start: Optional[int] = None,
        last_login_date_end: Optional[int] = None,
        join_date_start: Optional[int] = None,
        join_date_end: Optional[int] = None,
        statuses: Optional[str] = None,
    ):
        filters = {}
        if last_login_date_start is not None:
            filters["last_login_date_start"] = last_login_date_start
        if last_login_date_end is not None:
            filters["last_login_date_end"] = last_login_date_end
        if join_date_start is not None:
            filters["join_date_start"] = join_date_start
        if join_date_end is not None:
            filters["join_date_end"] = join_date_end
        if statuses is not None:
            filters["statuses"] = statuses

        accounts, total_count = self.user_persistence.get_base_accounts(
            search_query=search_query,
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order,
            exclude_test_users=exclude_test_users,
            filters=filters,
        )

        account_ids = [a.id for a in accounts]
        aggregates = self.user_persistence.get_customer_aggregates(account_ids)

        result = []
        for acc in accounts:
            cost_leads_overage = acc.overage_leads_count * 0.08
            agg = aggregates.get(acc.id, {})

            result.append(
                {
                    "id": acc.id,
                    "company_name": acc.company_name,
                    "owner_full_name": acc.full_name,
                    "email": acc.email,
                    "created_at": acc.created_at,
                    "last_login": acc.last_login,
                    "status": acc.user_status,
                    "is_trial": self.plans_persistence.get_trial_status_by_user_id(
                        acc.id
                    ),
                    "role": acc.role,
                    "is_email_validation_enabled": acc.is_email_validation_enabled,
                    "is_partner": acc.is_partner,
                    "is_master": acc.is_master,
                    "pixel_installed_count": agg.get(
                        "pixel_installed_count", 0
                    ),
                    "sources_count": agg.get("sources_count", 0),
                    "contacts_count": acc.total_leads,
                    "subscription_plan": acc.subscription_plan,
                    "lookalikes_count": agg.get("lookalikes_count", 0),
                    "type": "account",
                    "credits_count": acc.credits_count,
                    "is_another_domain_resolved": acc.is_another_domain_resolved,
                    "has_credit_card": acc.has_credit_card,
                    "cost_leads_overage": cost_leads_overage,
                    "whitelabel_settings_enabled": acc.whitelabel_settings_enabled,
                    "premium_sources": acc.premium_sources,
                }
            )

        return {"accounts": result, "count": total_count}

    def generate_access_token(self, user: dict, user_account_id: int):
        user_info = self.user_persistence.get_user_by_id(user_account_id)
        if not user_info:
            return None

        token_info = {
            "id": user_info.get("team_owner_id") or user_account_id,
            "requester_access_user_id": user.get("id"),
        }

        if user_info.get("team_owner_id"):
            token_info["team_member_id"] = user_account_id

        return create_access_token(token_info)

    def invite_user(self, user: dict, email: str, name: str):
        exists_user = self.user_persistence.get_user_by_email(email=email)
        exist_invite = self.admin_persistence.get_pending_invitation_by_email(
            email=email
        )
        if exists_user or exist_invite:
            return {"status": AdminStatus.ALREADY_EXISTS}
        template_id = self.send_grid_persistence.get_template_by_alias(
            SendgridTemplate.ADMIN_INVITATION_TEMPLATE.value
        )
        if not template_id:
            logger.info("template_id is None")
            return {"status": AdminStatus.SENDGRID_TEMPLATE_NOT_FAILED}

        md5_token_info = {
            "id": user.get("id"),
            "user_mail": email,
            "salt": os.getenv("SECRET_SALT"),
        }
        json_string = json.dumps(md5_token_info, sort_keys=True)
        md5_hash = hashlib.md5(json_string.encode()).hexdigest()
        confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/signup?admin_token={md5_hash}&user_mail={email}"
        mail_object = SendgridHandler()
        mail_object.send_sign_up_mail(
            to_emails=email,
            template_id=template_id,
            template_placeholder={"full_name": name, "link": confirm_email_url},
        )
        self.admin_persistence.save_pending_invitations_admin(
            email=email,
            full_name=name,
            invited_by_id=user.get("id"),
            md5_hash=md5_hash,
        )
        return {"status": AdminStatus.SUCCESS}

    def _resolve_base_user(self, user, owners_map):
        """Возвращает tuple: (base_user, email, full_name, created_at, last_login)."""
        if user.team_owner_id and user.team_owner_id in owners_map:
            owner = owners_map[user.team_owner_id]
            return (
                owner,
                user.email,
                user.full_name,
                user.created_at,
                user.last_login,
            )
        return (
            user,
            user.email,
            user.full_name,
            user.created_at,
            user.last_login,
        )

    def get_customer_users(
        self,
        *,
        search_query: str,
        page: int,
        per_page: int,
        sort_by: str,
        sort_order: str,
        exclude_test_users: bool,
        last_login_date_start: Optional[int] = None,
        last_login_date_end: Optional[int] = None,
        join_date_start: Optional[int] = None,
        join_date_end: Optional[int] = None,
        statuses: Optional[str] = None,
    ):
        filters = {}
        if last_login_date_start is not None:
            filters["last_login_date_start"] = last_login_date_start
        if last_login_date_end is not None:
            filters["last_login_date_end"] = last_login_date_end
        if join_date_start is not None:
            filters["join_date_start"] = join_date_start
        if join_date_end is not None:
            filters["join_date_end"] = join_date_end
        if statuses is not None:
            filters["statuses"] = statuses

        users, total_count = self.user_persistence.get_base_customers(
            search_query=search_query,
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order,
            exclude_test_users=exclude_test_users,
            filters=filters,
        )

        owner_ids = [u.team_owner_id for u in users if u.team_owner_id]
        owners_map = {}
        if owner_ids:
            owners = self.user_persistence.get_customers_by_ids(owner_ids)
            owners_map = {o.id: o for o in owners}

        user_ids = [u.id for u in users]
        aggregates = self.user_persistence.get_customer_aggregates(user_ids)

        result = []
        for user in users:
            base_user, email, full_name, created_at, last_login = (
                self._resolve_base_user(user, owners_map)
            )

            cost_leads_overage = base_user.overage_leads_count * 0.08
            agg = aggregates.get(user.id, {})
            result.append(
                {
                    "id": user.id,
                    "email": email,
                    "full_name": full_name,
                    "created_at": created_at,
                    "last_login": last_login,
                    "status": base_user.user_status,
                    "is_trial": self.plans_persistence.get_trial_status_by_user_id(
                        base_user.id
                    ),
                    "role": base_user.role,
                    "team_access_level": base_user.team_access_level,
                    "team_owner_id": user.team_owner_id,
                    "is_email_validation_enabled": base_user.is_email_validation_enabled,
                    "is_partner": base_user.is_partner,
                    "is_master": base_user.is_master,
                    "pixel_installed_count": agg.get(
                        "pixel_installed_count", 0
                    ),
                    "sources_count": agg.get("sources_count", 0),
                    "contacts_count": base_user.total_leads,
                    "subscription_plan": base_user.subscription_plan,
                    "lookalikes_count": agg.get("lookalikes_count", 0),
                    "type": "user",
                    "credits_count": base_user.credits_count,
                    "is_another_domain_resolved": base_user.is_another_domain_resolved,
                    "has_credit_card": base_user.has_credit_card,
                    "cost_leads_overage": cost_leads_overage,
                    "whitelabel_settings_enabled": base_user.whitelabel_settings_enabled,
                    "premium_sources": base_user.premium_sources,
                }
            )

        return {"users": result, "count": total_count}

    def get_all_domains_details(
        self,
        *,
        page: int,
        per_page: int,
        sort_by: str | None,
        sort_order: str | None,
        search_query: str | None,
    ):
        domains, total_count = self.user_persistence.get_domains_with_users(
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order,
            search_query=search_query,
        )

        result = []

        for d, user_name, company_name, sync_count, lead_count in domains:
            user_id = d.user_id

            resolutions = [
                {"date": date, "lead_count": count}
                for date, count in self.domain_persistence.leads_persistence.get_leads_count_by_day(
                    domain_id=d.id
                )
            ]

            contacts_resolving_domains = (
                self.domain_persistence.get_domains_with_contacts_resolving(
                    user_id
                )
            )

            status = (
                "Synced"
                if sync_count > 0
                else "Leads"
                if lead_count > 0
                else "No Leads"
            )

            result.append(
                {
                    "id": d.id,
                    "domain": d.domain,
                    "company_name": company_name,
                    "is_pixel_installed": d.is_pixel_installed,
                    "status": status,
                    "additional_pixel": {
                        "is_add_to_cart_installed": d.is_add_to_cart_installed,
                        "is_converted_sales_installed": d.is_converted_sales_installed,
                        "is_view_product_installed": d.is_view_product_installed,
                    },
                    "total_leads": lead_count,
                    "resolutions": resolutions,
                    "data_syncs_count": sync_count,
                    "created_at": d.created_at.isoformat()
                    if d.created_at
                    else None,
                }
            )

        return {"domains": result, "count": total_count}

    def get_partners_users(self, query_params: PartnersQueryParams):
        filters = {}
        if query_params.last_login_date_start is not None:
            filters["last_login_date_start"] = (
                query_params.last_login_date_start
            )
        if query_params.last_login_date_end is not None:
            filters["last_login_date_end"] = query_params.last_login_date_end
        if query_params.join_date_start is not None:
            filters["join_date_start"] = query_params.join_date_start
        if query_params.join_date_end is not None:
            filters["join_date_end"] = query_params.join_date_end
        if query_params.statuses is not None:
            filters["statuses"] = query_params.statuses

        users, total_count = self.user_persistence.get_base_partners_users(
            search_query=query_params.search_query,
            page=query_params.page,
            per_page=query_params.per_page,
            sort_by=query_params.sort_by,
            sort_order=query_params.sort_order,
            exclude_test_users=query_params.exclude_test_users,
            filters=filters,
            is_master=query_params.is_master,
        )

        user_ids = [user.id for user in users]

        aggregates = self.user_persistence.get_customer_aggregates(user_ids)

        result = []

        for user in users:
            user_id = user.id
            agg = aggregates.get(user_id, {})

            pixel_installed_count = agg.get("pixel_installed_count", 0)
            sources_count = agg.get("sources_count", 0)
            lookalikes_count = agg.get("lookalikes_count", 0)

            result.append(
                {
                    "id": user_id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "created_at": user.created_at,
                    "status": user.user_status,
                    "last_login": user.last_login,
                    "role": user.role,
                    "is_email_validation_enabled": user.is_email_validation_enabled,
                    "pixel_installed_count": pixel_installed_count,
                    "sources_count": sources_count,
                    "contacts_count": user.total_leads,
                    "subscription_plan": user.subscription_plan,
                    "lookalikes_count": lookalikes_count,
                    "type": "user",
                    "credits_count": user.credits_count,
                    "is_another_domain_resolved": user.is_another_domain_resolved,
                    "whitelabel_settings_enabled": user.whitelabel_settings_enabled,
                }
            )

        return {"users": result, "count": total_count}

    def get_audience_metrics(
        self,
        last_login_date_start: int,
        last_login_date_end: int,
        join_date_start: int,
        join_date_end: int,
        search_query: str,
        statuses: str,
        exclude_test_users: bool,
    ):
        audience_metrics = {}
        dashboard_audience_data = (
            self.dashboard_audience_persistence.get_audience_metrics(
                last_login_date_start=last_login_date_start,
                last_login_date_end=last_login_date_end,
                join_date_start=join_date_start,
                join_date_end=join_date_end,
                search_query=search_query,
                statuses=statuses,
                exclude_test_users=exclude_test_users,
            )
        )

        for result in dashboard_audience_data:
            key = result["key"]
            query = result["query"]
            count = query.scalar()
            audience_metrics[key] = count or 0

        audience_metrics["total_revenue"] = (
            audience_metrics["overage_sum"] * 0.08
        )
        audience_metrics.pop("overage_sum", None)

        return {"audience_metrics": audience_metrics}

    def get_user_by_email(self, email):
        user_object = (
            self.db.query(Users)
            .filter(func.lower(Users.email) == func.lower(email))
            .first()
        )
        return user_object

    def create_subscription_for_partner(self, user: Users):
        if not user.current_subscription_id:
            self.subscription_service.create_subscription_from_partners(
                user_id=user.id
            )
        else:
            user_subscription = self.subscription_service.get_user_subscription(
                user_id=user.id
            )
            if (
                user_subscription.is_trial
                or user_subscription.plan_end.replace(tzinfo=timezone.utc)
                < get_utc_aware_date()
            ):
                self.subscription_service.create_subscription_from_partners(
                    user_id=user.id
                )

    def update_user(self, update_data: UpdateUserRequest):
        user = (
            self.db.query(Users).filter(Users.id == update_data.user_id).first()
        )
        if not user:
            return UpdateUserStatus.USER_NOT_FOUND

        if update_data.is_partner:
            if update_data.is_partner == True:
                self.create_subscription_for_partner(user=user)
                commission = (
                    70
                    if update_data.commission >= 70
                    else update_data.commission
                )
                creating_data = {
                    "user_id": user.id,
                    "join_date": datetime.now(timezone.utc),
                    "name": user.full_name,
                    "email": user.email,
                    "company_name": user.company_name,
                    "commission": commission,
                    "token": get_md5_hash(user.email),
                    "is_master": True if update_data.is_master else False,
                    "status": "signup",
                }
                self.partners_persistence.create_partner(creating_data)
            user.is_partner = update_data.is_partner
            self.db.commit()

        return UpdateUserStatus.SUCCESS

    def get_user_subscription(self, user_id):
        user_subscription = (
            self.db.query(UserSubscriptions)
            .filter(UserSubscriptions.user_id == user_id)
            .first()
        )
        return user_subscription

    def get_free_trial_plan(self):
        free_trial_plan = (
            self.db.query(SubscriptionPlan)
            .filter(SubscriptionPlan.is_free_trial == True)
            .first()
        )
        return free_trial_plan

    def get_default_plan(self):
        default_plan = (
            self.db.query(SubscriptionPlan)
            .filter(SubscriptionPlan.is_default == True)
            .first()
        )
        return default_plan

    def set_user_subscription(self, user_id, plan_start, plan_end):
        (
            self.db.query(UserSubscriptions)
            .filter(Users.id == user_id)
            .update(
                {
                    UserSubscriptions.plan_start: plan_start,
                    UserSubscriptions.plan_end: plan_end,
                },
                synchronize_session=False,
            )
        )
        self.db.commit()

    def confirmation_customer(self, email, free_trial=None):
        user_data = self.get_user_by_email(email)
        if free_trial:
            self.subscription_service.create_subscription_from_free_trial(
                user_id=user_data.id
            )
        else:
            self.subscription_service.remove_trial(user_data.id)

        return user_data

    def change_email_validation(self, user_id: int) -> bool:
        updated_row = self.user_persistence.change_email_validation(user_id)
        return updated_row > 0

    def did_change_plan(self, user_id: int, plan_alias: str) -> bool:
        change_plan = self.user_subscription_service.move_to_plan(
            user_id=user_id, plan_alias=plan_alias
        )
        if change_plan:
            self.db.commit()
            return True
        return False

    def delete_domain(self, domain_id: int):
        return self.domain_persistence.delete_domain_admin(domain_id)
