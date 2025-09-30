import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, TypedDict
from decimal import Decimal

import pytz
from sqlalchemy import func, desc, asc, or_, and_, select, update, case
from sqlalchemy.orm import aliased
from sqlalchemy.sql import case as caseSQl, literal_column

from db_dependencies import Db
from enums import (
    TeamsInvitationStatus,
    SignUpStatus,
    UserStatusInAdmin,
    TypeFunds,
)
from models import (
    AudienceLookalikes,
    SubscriptionPlan,
    UserSubscriptions,
)
from models import premium_source
from models.partner import Partner
from models.premium_source import PremiumSource
from models.referral_payouts import ReferralPayouts
from models.referral_users import ReferralUser
from models.teams_invitations import TeamInvitation
from models.users import Users
from models.leads_users import LeadUser
from models.integrations import IntegrationUserSync
from models.users_domains import UserDomains
from models.audience_sources import AudienceSource
from resolver import injectable
from utils import end_of_month

logger = logging.getLogger(__name__)


class UserDict(TypedDict):
    """
    UserDict is incomplete type for object, used across the application
    when you add new fields, add them to this type also
    """

    id: int
    email: str
    role: list[str]
    full_name: str
    company_name: str | None
    created_at: datetime
    current_subscription_id: int
    random_seed: int
    team_owner_id: int | None
    whitelabel_settings_enabled: bool
    premium_source_credits: Decimal | None


@injectable
class UserPersistence:
    UNLIMITED_CREDITS = -1

    def __init__(self, db: Db):
        self.db = db

    def set_reset_password_sent_now(self, user_id: int):
        send_message_expiration_time = datetime.now()
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.reset_password_sent_at: send_message_expiration_time},
            synchronize_session=False,
        )
        self.db.commit()

    async def is_email_validation_enabled(self, users_id: int) -> bool:
        result = (
            self.db.query(Users.is_email_validation_enabled)
            .filter(Users.id == users_id)
            .scalar()
        )
        return result

    def save_user_domain(self, user_id: int, domain: str):
        user_domain = (
            self.db.query(UserDomains)
            .filter(
                UserDomains.domain == domain, UserDomains.user_id == user_id
            )
            .first()
        )
        if user_domain:
            return user_domain
        user_domain = UserDomains(
            user_id=user_id,
            domain=domain.replace("https://", "").replace("http://", ""),
        )
        self.db.add(user_domain)
        self.db.commit()
        return user_domain

    def charge_credit(self, user_id: int):
        user = self.db.query(Users).filter(Users.id == user_id).first()

        if user and user.leads_credits != self.UNLIMITED_CREDITS:
            user.leads_credits = user.leads_credits - 1
            self.db.commit()

    def get_team_members(self, user_id: int):
        users = (
            self.db.query(Users).filter(Users.team_owner_id == user_id).all()
        )
        return users

    def set_has_credit_card(self, user_id: int):
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.has_credit_card: True}, synchronize_session=False
        )
        self.db.commit()

    def get_combined_team_info(self, user_id: int):
        users = (
            self.db.query(Users).filter(Users.team_owner_id == user_id).all()
        )
        invitations = (
            self.db.query(TeamInvitation)
            .filter(TeamInvitation.team_owner_id == user_id)
            .all()
        )
        combined_info = users + invitations
        return combined_info

    def set_verified_email_sent_now(self, user_id: int):
        send_message_expiration_time = datetime.now()
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.verified_email_sent_at: send_message_expiration_time},
            synchronize_session=False,
        )
        self.db.commit()

    def get_user_by_email(self, email: str):
        user_object = (
            self.db.query(Users)
            .filter(func.lower(Users.email) == func.lower(email))
            .first()
        )
        return user_object

    def check_status_invitations(self, teams_token, user_mail):
        result = {"success": False}
        teams_invitation = (
            self.db.query(TeamInvitation)
            .filter(TeamInvitation.token == teams_token)
            .first()
        )
        if teams_invitation:
            if teams_invitation.mail != user_mail:
                result["error"] = SignUpStatus.NOT_VALID_EMAIL
            if teams_invitation.status == TeamsInvitationStatus.PENDING.value:
                result["success"] = True
                result["team_owner_id"] = teams_invitation.team_owner_id
        else:
            result["error"] = SignUpStatus.TEAM_INVITATION_INVALID
        return result

    def by_id(self, user_id: int) -> Optional[Users]:
        return self.db.execute(
            select(Users).where(Users.id == user_id)
        ).scalar()

    def by_customer_id(self, customer_id: str) -> Optional[Users]:
        return self.db.execute(
            select(Users).where(Users.customer_id == customer_id)
        ).scalar()

    def get_user_by_id(
        self, user_id: int, result_as_object=False
    ) -> UserDict | None:
        query_result = self.db.execute(
            select(Users, Partner.is_active)
            .filter(Users.id == user_id)
            .outerjoin(Partner, Partner.user_id == user_id)
        ).first()

        if query_result is None:
            return None

        user, partner_is_active = query_result.tuple()

        result_user = None
        if user:
            result_user = {
                "id": user.id,
                "email": user.email,
                "password": user.password,
                "is_email_confirmed": user.is_email_confirmed,
                "is_with_card": user.is_with_card,
                "is_company_details_filled": user.is_company_details_filled,
                "is_partner": user.is_partner,
                "business_type": user.business_type,
                "full_name": user.full_name,
                "team_owner_id": user.team_owner_id,
                "image": user.image,
                "company_name": user.company_name,
                "company_website": user.company_website,
                "company_email_address": user.company_email_address,
                "employees_workers": user.employees_workers,
                "created_at": user.created_at,
                "last_login": user.last_login,
                "customer_id": user.customer_id,
                "reset_password_sent_at": user.reset_password_sent_at,
                "pixel_code_sent_at": user.pixel_code_sent_at,
                "verified_email_sent_at": user.verified_email_sent_at,
                "is_book_call_passed": user.is_book_call_passed,
                "stripe_payment_url": user.stripe_payment_url,
                "role": user.role,
                "calendly_uuid": user.calendly_uuid,
                "calendly_invitee_uuid": user.calendly_invitee_uuid,
                "activate_steps_percent": user.activate_steps_percent,
                "leads_credits": user.leads_credits,
                "validation_funds": user.validation_funds,
                "is_leads_auto_charging": user.is_leads_auto_charging,
                "team_access_level": user.team_access_level,
                "current_subscription_id": user.current_subscription_id,
                "awin_awc": user.awin_awc,
                "source_platform": user.source_platform,
                "shop_domain": user.shop_domain,
                "shopify_token": user.shopify_token,
                "connected_stripe_account_id": user.connected_stripe_account_id,
                "utm_params": user.utm_params,
                "is_stripe_connected": user.is_stripe_connected,
                "stripe_connected_email": user.stripe_connected_email,
                "stripe_connected_currently_due": user.stripe_connected_currently_due,
                "partner_is_active": partner_is_active,
                "premium_source_credits": user.premium_source_credits,
                "smart_audience_quota": user.smart_audience_quota,
                "overage_leads_count": user.overage_leads_count,
                "is_email_validation_enabled": user.is_email_validation_enabled,
                "whitelabel_settings_enabled": user.whitelabel_settings_enabled,
                "random_seed": user.random_seed,
            }
        self.db.rollback()
        if result_as_object:
            return user
        return result_user

    def set_last_login(self, user_id):
        user = self.db.query(Users).filter(Users.id == user_id).first()
        user.last_login = datetime.now()
        self.db.commit()

    def get_user_team_member_by_id(self, user_id):
        user = self.db.query(Users).filter(Users.id == user_id).first()
        result_user = None
        if user:
            result_user = {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "team_access_level": user.team_access_level,
                "is_email_confirmed": user.is_email_confirmed,
                "change_email_sent_at": user.change_email_sent_at,
                "team_owner_id": user.team_owner_id,
                "password": user.password,
                "source_platform": user.source_platform,
            }
        self.db.rollback()
        return result_user

    def update_teams_owner_id(self, user_id, teams_token, owner_id):
        teams_invitation = (
            self.db.query(TeamInvitation)
            .filter(TeamInvitation.token == teams_token)
            .first()
        )
        user_data = self.db.query(Users).filter(Users.id == user_id).first()
        user_data.team_owner_id = owner_id
        user_data.is_email_confirmed = True
        user_data.team_access_level = teams_invitation.access_level
        user_data.invited_by_id = teams_invitation.invited_by_id
        user_data.added_on = datetime.now()
        self.db.flush()
        self.db.delete(teams_invitation)
        self.db.commit()

    def email_confirmed(self, user_id: int):
        query = self.db.query(Users).filter(Users.id == user_id)
        if query:
            self.db.query(Users).filter(Users.id == user_id).update(
                {"is_email_confirmed": True}
            )
            self.db.commit()

    def book_call_confirmed(self, user_id: int):
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.is_book_call_passed: True}, synchronize_session=False
        )
        self.db.commit()

    def set_partner_role(self, user_id: int):
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.is_partner: True}, synchronize_session=False
        )
        self.db.commit()

    def update_password(self, user_id: int, password: str):
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.password: password}, synchronize_session=False
        )
        self.db.commit()

    def update_calendly_uuid(self, user_id: int, uuid: str, invitees: str):
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.calendly_uuid: uuid, Users.calendly_invitee_uuid: invitees},
            synchronize_session=False,
        )
        self.db.commit()

    def get_users(self):
        users = self.db.query(
            Users.id,
            Users.email,
            Users.full_name,
            Users.created_at,
            Users.is_with_card,
            Users.company_name,
            Users.is_email_confirmed,
            Users.is_book_call_passed,
            Users.stripe_payment_url,
        ).all()

        return [
            {
                "id": user[0],
                "email": user[1],
                "full_name": user[2],
                "created_at": user[3],
                "is_with_card": user[4],
                "company_name": user[5],
                "is_email_confirmed": user[6],
                "is_book_call_passed": user[7],
                "stripe_payment_url": user[8],
            }
            for user in users
        ]

    def get_admin_users(
        self,
        search_query: str,
        last_login_date_start=None,
        last_login_date_end=None,
        join_date_start=None,
        join_date_end=None,
    ):
        Inviter = aliased(Users)
        query = self.db.query(
            Users.id,
            Users.email,
            Users.full_name,
            Users.created_at.label("created_at"),
            Users.last_login.label("last_login"),
            Inviter.email.label("invited_by_email"),
            Users.role,
        ).outerjoin(Inviter, Users.invited_by_id == Inviter.id)

        query = query.filter(Users.role.contains(["admin"]))

        if search_query:
            query = query.filter(
                or_(
                    Users.email.ilike(f"{search_query}%"),
                    Users.full_name.ilike(f"{search_query}%"),
                )
            )

        if last_login_date_start:
            start_date = datetime.fromtimestamp(
                last_login_date_start, tz=pytz.UTC
            ).date()
            query = query.filter(func.DATE(Users.last_login) >= start_date)

        if last_login_date_end:
            end_date = datetime.fromtimestamp(
                last_login_date_end, tz=pytz.UTC
            ).date()
            query = query.filter(func.DATE(Users.last_login) <= end_date)

        if join_date_start:
            start_date = datetime.fromtimestamp(
                join_date_start, tz=pytz.UTC
            ).date()
            query = query.filter(func.DATE(Users.created_at) >= start_date)

        if join_date_end:
            end_date = datetime.fromtimestamp(join_date_end, tz=pytz.UTC).date()
            query = query.filter(func.DATE(Users.created_at) <= end_date)

        return query.all()

    def calculate_user_status(self):
        return case(
            (
                Users.is_email_confirmed == False,
                UserStatusInAdmin.NEED_CONFIRM_EMAIL.value,
            ),
            (
                or_(
                    ~self.db.query(UserDomains.id)
                    .filter(UserDomains.user_id == Users.id)
                    .exists(),
                    ~self.db.query(UserDomains.id)
                    .filter(
                        UserDomains.user_id == Users.id,
                        UserDomains.is_pixel_installed == True,
                    )
                    .exists(),
                ),
                UserStatusInAdmin.PIXEL_NOT_INSTALLED.value,
            ),
            (
                and_(
                    self.db.query(UserDomains.id)
                    .filter(
                        UserDomains.user_id == Users.id,
                        UserDomains.is_pixel_installed == True,
                        func.timezone("UTC", func.now())
                        - UserDomains.pixel_installation_date
                        <= timedelta(hours=24),
                    )
                    .exists(),
                    ~self.db.query(LeadUser.id)
                    .join(UserDomains, LeadUser.domain_id == UserDomains.id)
                    .filter(UserDomains.user_id == Users.id)
                    .exists(),
                ),
                UserStatusInAdmin.WAITING_CONTACTS.value,
            ),
            (
                and_(
                    self.db.query(UserDomains.id)
                    .filter(
                        UserDomains.user_id == Users.id,
                        UserDomains.is_pixel_installed == True,
                        func.timezone("UTC", func.now())
                        - UserDomains.pixel_installation_date
                        > timedelta(hours=24),
                    )
                    .exists(),
                    ~self.db.query(LeadUser.id)
                    .join(UserDomains, LeadUser.domain_id == UserDomains.id)
                    .filter(UserDomains.user_id == Users.id)
                    .exists(),
                ),
                UserStatusInAdmin.RESOLUTION_FAILED.value,
            ),
            (
                and_(
                    self.db.query(LeadUser.id)
                    .filter(LeadUser.domain_id == UserDomains.id)
                    .exists(),
                    ~self.db.query(IntegrationUserSync.id)
                    .join(
                        UserDomains,
                        IntegrationUserSync.domain_id == UserDomains.id,
                    )
                    .filter(UserDomains.user_id == Users.id)
                    .exists(),
                ),
                UserStatusInAdmin.SYNC_NOT_COMPLETED.value,
            ),
            (
                and_(
                    self.db.query(LeadUser.id)
                    .filter(LeadUser.domain_id == UserDomains.id)
                    .exists(),
                    self.db.query(IntegrationUserSync.id)
                    .filter(
                        IntegrationUserSync.domain_id == UserDomains.id,
                        IntegrationUserSync.sync_status == False,
                    )
                    .exists(),
                ),
                UserStatusInAdmin.SYNC_ERROR.value,
            ),
            (
                self.db.query(IntegrationUserSync.id)
                .filter(
                    IntegrationUserSync.domain_id == UserDomains.id,
                    IntegrationUserSync.sync_status == True,
                )
                .exists(),
                UserStatusInAdmin.DATA_SYNCING.value,
            ),
        )

    def _base_customer_query(self):
        status_case = self.calculate_user_status()

        subq_domain_resolved = (
            self.db.query(UserDomains.user_id)
            .filter(
                UserDomains.user_id == Users.id,
                UserDomains.is_another_domain_resolved.is_(True),
            )
            .exists()
        )

        subscription_plan_case = caseSQl(
            (
                and_(
                    Users.current_subscription_id == None,
                    Users.total_leads == 0,
                ),
                literal_column("'N/A'"),
            ),
            else_=SubscriptionPlan.title,
        ).label("subscription_plan")

        premium_source_count = premium_source.count_by_user().subquery()

        query = (
            self.db.query(
                Users.id,
                Users.email,
                Users.full_name,
                Users.created_at,
                Users.last_login,
                Users.role,
                Users.team_owner_id,
                Users.leads_credits.label("credits_count"),
                Users.total_leads,
                Users.is_email_validation_enabled.label(
                    "is_email_validation_enabled"
                ),
                Users.overage_leads_count,
                Users.has_credit_card,
                subscription_plan_case,
                status_case.label("user_status"),
                case((subq_domain_resolved, True), else_=False).label(
                    "is_another_domain_resolved"
                ),
                Users.whitelabel_settings_enabled,
                Users.is_partner,
                Partner.is_master.label("is_master"),
                func.coalesce(premium_source_count.c.count, 0).label(
                    "premium_sources"
                ),
            )
            .outerjoin(
                UserSubscriptions,
                UserSubscriptions.id == Users.current_subscription_id,
            )
            .outerjoin(
                SubscriptionPlan,
                SubscriptionPlan.id == UserSubscriptions.plan_id,
            )
            .outerjoin(
                premium_source_count, premium_source_count.c.id == Users.id
            )
            .outerjoin(Partner, Partner.user_id == Users.id)
            .filter(Users.role.any("customer"))
        )

        return query, status_case

    def get_base_customers(
        self,
        search_query,
        page,
        per_page,
        sort_by: str,
        sort_order,
        exclude_test_users,
        filters,
    ):
        query, status_case = self._base_customer_query()

        if exclude_test_users:
            query = query.filter(~Users.full_name.like("#test%"))

        if filters.get("statuses"):
            statuses = [
                s.strip().lower() for s in filters["statuses"].split(",")
            ]
            filter_conditions = []
            if "multiple_domains" in statuses:
                filter_conditions.append(
                    query.column_descriptions[13]["expr"]
                )  # is_another_domain_resolved
                statuses.remove("multiple_domains")
            if statuses:
                filter_conditions.append(func.lower(status_case).in_(statuses))
            if filter_conditions:
                query = query.filter(or_(*filter_conditions))

        if filters.get("last_login_date_start"):
            last_login_date_start = datetime.fromtimestamp(
                filters["last_login_date_start"], tz=pytz.UTC
            ).date()
            query = query.filter(
                func.DATE(Users.last_login) >= last_login_date_start
            )

        if filters.get("last_login_date_end"):
            last_login_date_end = datetime.fromtimestamp(
                filters["last_login_date_end"], tz=pytz.UTC
            ).date()
            query = query.filter(
                func.DATE(Users.last_login) <= last_login_date_end
            )

        if filters.get("join_date_start"):
            join_date_start = datetime.fromtimestamp(
                filters["join_date_start"], tz=pytz.UTC
            ).date()
            query = query.filter(func.DATE(Users.created_at) >= join_date_start)

        if filters.get("join_date_end"):
            join_date_end = datetime.fromtimestamp(
                filters["join_date_end"], tz=pytz.UTC
            ).date()
            query = query.filter(func.DATE(Users.created_at) <= join_date_end)

        if search_query:
            query = query.filter(
                or_(
                    Users.email.ilike(f"%{search_query}%"),
                    Users.full_name.ilike(f"%{search_query}%"),
                )
            )

        sort_options = {
            "id": Users.id,
            "join_date": Users.created_at,
            "last_login_date": Users.last_login,
            "contacts_count": Users.total_leads,
            "has_credit_card": Users.has_credit_card,
            "cost_leads_overage": Users.overage_leads_count,
        }
        sort_column = sort_options.get(sort_by, Users.created_at)
        query = query.order_by(
            asc(sort_column) if sort_order == "asc" else desc(sort_column)
        )

        total_count = query.count()
        users = query.offset((page - 1) * per_page).limit(per_page).all()
        return users, total_count

    def get_customers_by_ids(self, ids: list[int]) -> list:
        if not ids:
            return []
        query, _ = self._base_customer_query()
        return query.filter(Users.id.in_(ids)).all()

    def get_customer_aggregates(self, user_ids: list[int]):
        pixel_counts = dict(
            self.db.query(UserDomains.user_id, func.count(UserDomains.id))
            .filter(
                UserDomains.user_id.in_(user_ids),
                UserDomains.is_pixel_installed == True,
            )
            .group_by(UserDomains.user_id)
            .all()
        )

        sources_counts = dict(
            self.db.query(AudienceSource.user_id, func.count(AudienceSource.id))
            .filter(AudienceSource.user_id.in_(user_ids))
            .group_by(AudienceSource.user_id)
            .all()
        )

        lookalikes_counts = dict(
            self.db.query(
                AudienceLookalikes.user_id, func.count(AudienceLookalikes.id)
            )
            .filter(AudienceLookalikes.user_id.in_(user_ids))
            .group_by(AudienceLookalikes.user_id)
            .all()
        )

        return {
            user_id: {
                "pixel_installed_count": pixel_counts.get(user_id, 0),
                "sources_count": sources_counts.get(user_id, 0),
                "lookalikes_count": lookalikes_counts.get(user_id, 0),
            }
            for user_id in user_ids
        }

    def get_not_partner_users(self, page, per_page):
        query = self.db.query(
            Users.id,
            Users.email,
            Users.full_name,
            Users.created_at,
            Users.is_with_card,
            Users.company_name,
            Users.is_email_confirmed,
            Users.is_book_call_passed,
            Users.stripe_payment_url,
        ).filter(Users.is_partner == False)
        total_count = query.count()
        users = (
            query.order_by(desc(Users.id))
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        users_dict = [
            dict(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                created_at=user.created_at,
                is_with_card=user.is_with_card,
                company_name=user.company_name,
                is_email_confirmed=user.is_email_confirmed,
                is_book_call_passed=user.is_book_call_passed,
                stripe_payment_url=user.stripe_payment_url,
            )
            for user in users
        ]
        return users_dict, total_count

    def add_stripe_account(
        self, user_id: int, stripe_connected_account_id: str
    ):
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.connected_stripe_account_id: stripe_connected_account_id},
            synchronize_session=False,
        )
        self.db.commit()

    def confirm_stripe_connect(self, user_id: int):
        user = self.db.query(Users).filter(Users.id == user_id).first()
        if not user:
            return False

        user.is_stripe_connected = True
        user.stripe_connected_currently_due = None

        if user.is_partner:
            partner = (
                self.db.query(Partner)
                .filter(Partner.user_id == user_id)
                .first()
            )
            if partner:
                partner.status = "active"

        self.db.commit()
        return True

    def update_stripe_info(
        self, user_id: int, email: str = None, currently_due: list = None
    ):
        update_data = {}
        if email:
            update_data[Users.stripe_connected_email] = email
        if currently_due:
            update_data[Users.stripe_connected_currently_due] = currently_due

        if update_data:
            self.db.query(Users).filter(Users.id == user_id).update(
                update_data, synchronize_session=False
            )
            self.db.commit()

    def delete_stripe_info(self, user_id: int):
        self.db.query(Users).filter(Users.id == user_id).update(
            {
                Users.connected_stripe_account_id: None,
                Users.is_stripe_connected: False,
                Users.stripe_connected_currently_due: None,
                Users.stripe_connected_email: None,
            },
            synchronize_session=False,
        )
        self.db.commit()

    def get_accounts(
        self, search_term, start_date, end_date, offset, limit, order_by, order
    ):
        parent_users = aliased(Users)

        premium_source_counts = premium_source.count_by_user().subquery()

        order_column = getattr(Users, order_by, Users.id)
        order_direction = (
            asc(order_column) if order == "asc" else desc(order_column)
        )

        query = (
            self.db.query(
                Users.id,
                Users.email,
                Users.full_name,
                Users.created_at,
                ReferralPayouts.plan_amount,
                ReferralPayouts.status,
                ReferralPayouts.paid_at,
                Users.is_email_confirmed,
                Users.is_stripe_connected,
                ReferralUser.referral_program_type,
                parent_users.company_name.label("parent_company"),
                ReferralUser.parent_user_id,
                ReferralPayouts.status,
                ReferralPayouts.created_at,
                Users.source_platform,
                Users.utm_params,
                Users.whitelabel_settings_enabled,
                premium_source_counts.c.count,
            )
            .outerjoin(ReferralPayouts, Users.id == ReferralPayouts.user_id)
            .outerjoin(ReferralUser, Users.id == ReferralUser.user_id)
            .outerjoin(
                premium_source_counts, premium_source_counts.c.id == Users.id
            )
            .outerjoin(
                parent_users, ReferralUser.parent_user_id == parent_users.id
            )
            .filter(
                Users.is_partner == False,
                (Users.role == None) | ~Users.role.any("admin"),
            )
        )

        if search_term:
            query = query.filter(
                (Users.full_name.ilike(search_term))
                | (Users.email.ilike(search_term))
            )

        if start_date:
            query = query.filter(Users.created_at >= start_date)
        if end_date:
            end_date = datetime.combine(end_date, datetime.max.time())
            query = query.filter(Users.created_at <= end_date)

        query = query.order_by(order_direction)

        accounts = query.offset(offset).limit(limit).all()

        def parse_utm_source(utm_params):
            try:
                utm_data = json.loads(utm_params) if utm_params else {}
                return utm_data.get("utm_source", "Other").capitalize()
            except json.JSONDecodeError:
                return "Other"

        result = []
        for account in accounts:
            whitelabel_settings_enabled = account[16]

            result.append(
                {
                    "id": account[0],
                    "email": account[1],
                    "full_name": account[2],
                    "created_at": account[3],
                    "plan_amount": account[4] if account[4] else "--",
                    "status": (
                        "Signup"
                        if account[7] and not account[8]
                        else "Active"
                        if account[7] and account[8]
                        else "Inactive"
                    ),
                    "sources": (
                        f"{account[9].capitalize()}({account[10]})"
                        if account[9] and account[10]
                        else account[14]
                        if account[14]
                        else parse_utm_source(account[15])
                    ),
                    "reward_status": account[5].capitalize()
                    if account[5]
                    else "Inactive",
                    "will_pay": True if account[12] else False,
                    "paid_at": False if account[6] else True,
                    "reward_payout_date": account[6]
                    if account[6]
                    else (datetime.now().replace(day=1) + timedelta(days=32))
                    .replace(day=1)
                    .strftime("%Y-%m-%d"),
                    "last_payment_date": account[13],
                    "whitelabel_settings_enabled": whitelabel_settings_enabled,
                    "premium_source_count": account[17],
                }
            )
        return result, query.count()

    def has_sources_for_user(self, user_id: int) -> bool:
        return (
            self.db.query(AudienceSource)
            .filter(AudienceSource.user_id == user_id)
            .first()
            is not None
        )

    def deduct_validation_funds(self, user_id: int, amount: Decimal) -> Decimal:
        user = self.db.query(Users).filter(Users.id == user_id).first()

        if not user or user.validation_funds <= 0:
            return Decimal("0")

        to_deduct = min(user.validation_funds, amount)

        user.validation_funds -= to_deduct

        return to_deduct

    def by_email(self, email: str) -> Optional[Users]:
        return self.db.execute(
            select(Users).where(Users.email == email)
        ).scalar()

    def update_users_credits(self, subscription_ids: any, credits: int):
        stmt_users = (
            update(Users)
            .where(Users.current_subscription_id.in_(subscription_ids))
            .values(leads_credits=credits)
        )
        result = self.db.execute(stmt_users)
        return result

    def update_subscriptions_dates(self, subscription_ids: any):
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        stmt_subs = (
            update(UserSubscriptions)
            .where(UserSubscriptions.id.in_(subscription_ids))
            .values(plan_start=now, plan_end=end_of_month(now))
        )
        result = self.db.execute(stmt_subs)
        return result

    def decrease_overage_leads_count(self, customer_id: str, quantity: int):
        stmt_users = (
            update(Users)
            .where(Users.customer_id == customer_id)
            .values(
                overage_leads_count=func.greatest(
                    Users.overage_leads_count - quantity, 0
                )
            )
        )
        result = self.db.execute(stmt_users)
        self.db.commit()
        return result.rowcount

    def increase_funds_count(
        self, customer_id: str, quantity: int, type_funds: TypeFunds
    ):
        if type_funds == TypeFunds.VALIDATION_FUNDS:
            field_to_update = Users.validation_funds
        elif type_funds == TypeFunds.PREMIUM_SOURCES_FUNDS:
            field_to_update = Users.premium_source_credits

        stmt_users = (
            update(Users)
            .where(Users.customer_id == customer_id)
            .values(
                **{
                    field_to_update.key: func.greatest(
                        field_to_update + quantity, 0
                    )
                }
            )
        )
        result = self.db.execute(stmt_users)
        self.db.commit()
        return result.rowcount

    def change_email_validation(self, user_id: int) -> int:
        updated_count = (
            self.db.query(Users)
            .filter(Users.id == user_id)
            .update(
                {
                    Users.is_email_validation_enabled: ~Users.is_email_validation_enabled
                },
                synchronize_session=False,
            )
        )
        self.db.commit()
        return updated_count

    def get_base_partners_users(
        self,
        search_query: str,
        page: int,
        per_page: int,
        sort_by: str,
        sort_order: str,
        exclude_test_users: bool,
        filters: dict,
        is_master: bool,
    ):
        status_case = self.calculate_user_status()

        subq_domain_resolved = (
            self.db.query(UserDomains.user_id)
            .filter(
                UserDomains.user_id == Users.id,
                UserDomains.is_another_domain_resolved.is_(True),
            )
            .exists()
        )

        subscription_plan_case = case(
            (
                and_(
                    Users.current_subscription_id == None,
                    Users.total_leads == 0,
                ),
                literal_column("'N/A'"),
            ),
            else_=SubscriptionPlan.title,
        ).label("subscription_plan")

        query = (
            self.db.query(
                Users.id,
                Users.email,
                Users.full_name,
                Users.created_at,
                Users.last_login,
                Users.role,
                Users.leads_credits.label("credits_count"),
                Users.total_leads,
                Users.is_email_validation_enabled.label(
                    "is_email_validation_enabled"
                ),
                subscription_plan_case,
                status_case.label("user_status"),
                case((subq_domain_resolved, True), else_=False).label(
                    "is_another_domain_resolved"
                ),
                Users.whitelabel_settings_enabled,
            )
            .join(Partner, Partner.user_id == Users.id)
            .filter(Partner.is_master.is_(is_master))
            .outerjoin(
                UserSubscriptions,
                UserSubscriptions.id == Users.current_subscription_id,
            )
            .outerjoin(
                SubscriptionPlan,
                SubscriptionPlan.id == UserSubscriptions.plan_id,
            )
        )

        if exclude_test_users:
            query = query.filter(~Users.full_name.like("#test%"))

        if filters.get("statuses"):
            statuses = [
                status.strip().lower()
                for status in filters["statuses"].split(",")
            ]

            filter_conditions = []

            if "multiple_domains" in statuses:
                filter_conditions.append(
                    case((subq_domain_resolved, True), else_=False).is_(True)
                )
                statuses.remove("multiple_domains")

            if statuses:
                filter_conditions.append(func.lower(status_case).in_(statuses))

            if filter_conditions:
                query = query.filter(or_(*filter_conditions))

        if filters.get("last_login_date_start"):
            last_login_date_start = datetime.fromtimestamp(
                filters["last_login_date_start"], tz=pytz.UTC
            ).date()
            query = query.filter(
                func.DATE(Users.last_login) >= last_login_date_start
            )

        if filters.get("last_login_date_end"):
            last_login_date_end = datetime.fromtimestamp(
                filters["last_login_date_end"], tz=pytz.UTC
            ).date()
            query = query.filter(
                func.DATE(Users.last_login) <= last_login_date_end
            )

        if filters.get("join_date_start"):
            join_date_start = datetime.fromtimestamp(
                filters["join_date_start"], tz=pytz.UTC
            ).date()
            query = query.filter(func.DATE(Users.created_at) >= join_date_start)

        if filters.get("join_date_end"):
            join_date_end = datetime.fromtimestamp(
                filters["join_date_end"], tz=pytz.UTC
            ).date()
            query = query.filter(func.DATE(Users.created_at) <= join_date_end)

        if search_query:
            query = query.filter(
                or_(
                    Users.email.ilike(f"%{search_query}%"),
                    Users.full_name.ilike(f"%{search_query}%"),
                )
            )

        sort_options = {
            "id": Users.id,
            "join_date": Users.created_at,
            "last_login_date": Users.last_login,
            "contacts_count": Users.total_leads,
        }
        sort_column = sort_options.get(sort_by, Users.created_at)
        query = query.order_by(
            asc(sort_column) if sort_order == "asc" else desc(sort_column)
        )

        total_count = query.count()
        users = query.offset((page - 1) * per_page).limit(per_page).all()
        return users, total_count
