import logging
import os
from typing import Optional

import stripe
from fastapi import HTTPException, status

from enums import VerifyToken, PaymentStatus
from models import UserSubscriptions
from models.users import User
from persistence.leads_persistence import LeadsPersistence
from persistence.plans_persistence import PlansPersistence
from persistence.sendgrid_persistence import SendgridPersistence
from persistence.settings_persistence import SettingsPersistence
from persistence.team_invitation_persistence import TeamInvitationPersistence
from persistence.user_persistence import UserPersistence
from schemas.settings import (
    AccountDetailsRequest,
    BillingSubscriptionDetails,
    SubscriptionDetails,
    BillingCycle,
    PlanName,
    LimitedDetail,
    FundsDetail,
    NextBillingDate,
    TotalKey,
    ActivePlan,
    DowngradePlan,
    PlansResponse,
    Plan,
    Price,
    Advantage,
)
from services.domains import UserDomainsService
from services.subscriptions import SubscriptionService
from .jwt_service import (
    get_password_hash,
    create_access_token,
    decode_jwt_data,
    verify_password,
)

logger = logging.getLogger(__name__)
from datetime import datetime, timedelta
from .sendgrid import SendgridHandler
from enums import SettingStatus, SendgridTemplate, TeamAccessLevel
import hashlib
import json
from services.stripe_service import *
from decimal import Decimal
from schemas.settings import BuyFundsRequest, BuyCreditsRequest


@injectable
class SettingsService:
    COST_CONTACT_ON_BASIC_PLAN = Decimal(0.08)

    def __init__(
        self,
        settings_persistence: SettingsPersistence,
        plan_persistence: PlansPersistence,
        user_persistence: UserPersistence,
        send_grid_persistence: SendgridPersistence,
        subscription_service: SubscriptionService,
        user_domains_service: UserDomainsService,
        lead_persistence: LeadsPersistence,
        team_invitation_persistence: TeamInvitationPersistence,
        stripe_service: StripeService,
    ):
        self.settings_persistence = settings_persistence
        self.plan_persistence = plan_persistence
        self.subscription_service = subscription_service
        self.user_persistence = user_persistence
        self.send_grid_persistence = send_grid_persistence
        self.user_domains_service = user_domains_service
        self.lead_persistence = lead_persistence
        self.team_invitation_persistence = team_invitation_persistence
        self.stripe_service = stripe_service

    def get_account_details(self, user):
        member_id = None
        if user.get("team_member"):
            member_id = user.get("team_member").get("id")
        user_info = self.settings_persistence.get_account_details(
            owner_id=user.get("id"), member_id=member_id
        )
        if user_info:
            return {
                "full_name": user_info.full_name,
                "email_address": user_info.email,
                "reset_password_sent_at": user_info.reset_password_sent_at,
                "company_name": user_info.company_name,
                "company_website": user_info.company_website,
                "is_pass_exists": user_info.password is not None,
                "company_website_visits": user_info.company_website_visits,
                "is_email_confirmed": user_info.is_email_confirmed,
                "has_subscription": user.get("current_subscription_id")
                is not None,
            }

    def change_account_details(
        self, user: dict, account_details: AccountDetailsRequest
    ):
        changes = {}

        if account_details.business_info:
            if user.get("team_member"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. Owner only.",
                )
            if account_details.business_info.organization_name:
                changes["company_name"] = (
                    account_details.business_info.organization_name
                )
            if account_details.business_info.company_website:
                changes["company_website"] = (
                    account_details.business_info.company_website
                )
            if account_details.business_info.visits_to_website:
                changes["company_website_visits"] = (
                    account_details.business_info.visits_to_website
                )

        if account_details.account:
            if user.get("team_member"):
                user_id = user.get("team_member").get("id")
                user = self.user_persistence.get_user_by_id(user_id)

            if account_details.account.full_name:
                changes["full_name"] = account_details.account.full_name
            if account_details.account.email_address:
                if user.get("is_email_confirmed") == False:
                    return SettingStatus.EMAIL_NOT_CONFIRMED
                template_id = self.send_grid_persistence.get_template_by_alias(
                    SendgridTemplate.CHANGE_EMAIL_TEMPLATE.value
                )
                if not template_id:
                    logger.info("template_id is None")
                    return SettingStatus.FAILED
                message_expiration_time = user.get("change_email_sent_at")
                time_now = datetime.now()
                if message_expiration_time is not None:
                    if (
                        message_expiration_time + timedelta(minutes=1)
                    ) > time_now:
                        return SettingStatus.RESEND_TOO_SOON
                token_info = {
                    "id": user.get("id"),
                }
                token = create_access_token(token_info)
                confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/authentication/verify-token?token={token}&mail={account_details.account.email_address}"
                mail_object = SendgridHandler()
                mail_object.send_sign_up_mail(
                    to_emails=account_details.account.email_address,
                    template_id=template_id,
                    template_placeholder={
                        "full_name": user.get("full_name"),
                        "link": confirm_email_url,
                    },
                )
                self.settings_persistence.set_reset_email_sent_now(
                    user.get("id")
                )
                logger.info("Confirmation Email Sent")

        if account_details.change_password:
            if (
                account_details.change_password.current_password
                and account_details.change_password.new_password
            ):
                if not verify_password(
                    account_details.change_password.current_password,
                    user.get("password"),
                ):
                    return SettingStatus.INCORRECT_PASSWORD
                changes["password"] = get_password_hash(
                    account_details.change_password.new_password
                )
                self.settings_persistence.set_reset_password_sent_now(
                    user.get("id")
                )

        if account_details.set_password:
            if account_details.set_password.new_password:
                if user.get("password"):
                    return SettingStatus.INCORRECT_PASSWORD
                changes["password"] = get_password_hash(
                    account_details.set_password.new_password
                )
                self.settings_persistence.set_reset_password_sent_now(
                    user.get("id")
                )

        if changes:
            self.settings_persistence.change_columns_data_by_userid(
                changes, user.get("id")
            )

        return SettingStatus.SUCCESS

    def change_email_account_details(self, token, email: str):
        if email is None:
            SettingStatus.INCORRECT_MAIL
        try:
            data = decode_jwt_data(token)
        except:
            return {"status": VerifyToken.INCORRECT_TOKEN}

        check_user_object = self.user_persistence.get_user_by_id(data.get("id"))
        if check_user_object:
            changes = {}
            changes["email"] = email
            self.settings_persistence.change_columns_data_by_userid(
                changes, data.get("id")
            )
            token_info = {
                "id": check_user_object.get("id"),
            }
            user_token = create_access_token(token_info)
            return {"status": VerifyToken.SUCCESS, "user_token": user_token}
        return {"status": VerifyToken.INCORRECT_TOKEN}

    def get_team_members(self, user: dict):
        result = {}
        team_arr = []
        teams_data = self.settings_persistence.get_team_members_by_userid(
            user_id=user.get("id")
        )
        for team_data in teams_data:
            invited, inviter_mail = team_data
            team_info = {
                "email": invited.email,
                "last_sign_in": invited.last_login.strftime("%b %d, %Y")
                if invited.last_login
                else None,
                "access_level": invited.team_access_level,
                "invited_by": inviter_mail,
                "added_on": invited.added_on.strftime("%b %d, %Y")
                if invited.added_on
                else None,
            }
            team_arr.append(team_info)
        result["teams"] = team_arr
        current_subscription = self.plan_persistence.get_user_subscription(
            user_id=user.get("id")
        )
        member_limit = current_subscription.members_limit
        member_count = len(
            self.user_persistence.get_team_members(user_id=user.get("id"))
        )
        result["member_limit"] = member_limit if current_subscription else 0
        result["member_count"] = member_count + 1 if current_subscription else 0
        return result

    def get_pending_invations(self, user: dict):
        result = []
        invations_data = self.team_invitation_persistence.get_all_by_user_id(
            user_id=user.get("id")
        )
        for invation_data in invations_data:
            team_info = {
                "email": invation_data.mail,
                "role": invation_data.access_level,
                "date": invation_data.date_invited_at.strftime("%b %d, %Y")
                if invation_data.date_invited_at
                else None,
                "status": invation_data.status,
            }
            result.append(team_info)
        return result

    def check_team_invitations_limit(self, user):
        user_limit = self.subscription_service.check_invitation_limit(
            user_id=user.get("id")
        )
        if user_limit is False:
            return SettingStatus.INVITATION_LIMIT_REACHED
        return SettingStatus.INVITATION_LIMIT_NOT_REACHED

    def change_user_role(
        self, user: dict, email, access_level=TeamAccessLevel.READ_ONLY
    ):
        self.settings_persistence.change_user_role(email, access_level)
        return {
            "status": SettingStatus.SUCCESS,
        }

    def _get_invitation_template_id(self) -> Optional[str]:
        template_id = self.send_grid_persistence.get_template_by_alias(
            SendgridTemplate.TEAM_MEMBERS_TEMPLATE.value
        )
        if not template_id:
            logger.info("template_id is None")
        return template_id

    def _generate_invitation_link(
        self, user_id: str, invited_user: str
    ) -> tuple[str, str]:
        md5_token_info = {
            "id": user_id,
            "user_mail": invited_user,
            "salt": os.getenv("SECRET_SALT"),
        }
        json_string = json.dumps(md5_token_info, sort_keys=True)
        md5_hash = hashlib.md5(json_string.encode()).hexdigest()
        confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/signup?teams_token={md5_hash}&user_mail={invited_user}"
        return confirm_email_url, md5_hash

    def _send_invitation_email(
        self, to_email: str, link: str, company_name: str, template_id: str
    ):
        mail_object = SendgridHandler()
        mail_object.send_sign_up_mail(
            to_emails=to_email,
            template_id=template_id,
            template_placeholder={
                "full_name": to_email,
                "link": link,
                "company_name": company_name,
            },
        )

    def invite_user(
        self,
        user: dict,
        invite_user,
        access_level=TeamAccessLevel.READ_ONLY,
    ):
        user_id = user.get("id")
        if not self.subscription_service.check_invitation_limit(
            user_id=user_id
        ):
            return {"status": SettingStatus.INVITATION_LIMIT_REACHED}

        if access_level not in {
            TeamAccessLevel.ADMIN.value,
            TeamAccessLevel.OWNER.value,
            TeamAccessLevel.STANDARD.value,
            TeamAccessLevel.READ_ONLY.value,
        }:
            raise HTTPException(
                status_code=500,
                detail={"error": SettingStatus.INVALID_ACCESS_LEVEL.value},
            )

        if self.team_invitation_persistence.exists(
            user_id=user_id, email=invite_user
        ):
            return {"status": SettingStatus.ALREADY_INVITED}

        template_id = self._get_invitation_template_id()
        if not template_id:
            return {"status": SettingStatus.FAILED}

        confirm_link, md5_hash = self._generate_invitation_link(
            user_id, invite_user
        )
        self._send_invitation_email(
            invite_user, confirm_link, user["full_name"], template_id
        )

        invited_by_id = user.get("team_member", {}).get("id") or user_id
        self.team_invitation_persistence.create(
            team_owner_id=user_id,
            user_mail=invite_user,
            invited_by_id=invited_by_id,
            access_level=access_level,
            token=md5_hash,
        )

        return {"status": SettingStatus.SUCCESS}

    def resend_invitation_email(
        self,
        user: dict,
        invite_user: str,
        access_level: str | None = TeamAccessLevel.READ_ONLY.value,
    ):
        if user.get("team_member") and user["team_member"].get(
            "team_access_level"
        ) not in {
            TeamAccessLevel.ADMIN.value,
            TeamAccessLevel.OWNER.value,
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Admins only.",
            )

        last_invite = self.team_invitation_persistence.get_by_user_and_email(
            user_id=user["id"], email=invite_user
        )
        if last_invite and last_invite.date_invited_at:
            time_diff = datetime.utcnow() - last_invite.date_invited_at
            if time_diff.total_seconds() < 300:
                return {"status": SettingStatus.TOO_SOON}

        template_id = self._get_invitation_template_id()
        if not template_id:
            return {"status": SettingStatus.FAILED}

        confirm_link, _ = self._generate_invitation_link(
            user["id"], invite_user
        )
        self._send_invitation_email(
            invite_user, confirm_link, user["full_name"], template_id
        )

        self.team_invitation_persistence.update_timestamp(
            user_id=user["id"],
            email=invite_user,
        )

        return {"status": SettingStatus.SUCCESS}

    def change_teams(self, user: dict, teams_details):
        pending_invitation_revoke = teams_details.pending_invitation_revoke
        remove_user = teams_details.remove_user
        if pending_invitation_revoke:
            self.team_invitation_persistence.delete(
                user_id=user.get("id"), email=pending_invitation_revoke
            )
        if remove_user:
            mail = (
                user.get("team_member").get("email")
                if user.get("team_member")
                else user.get("email")
            )
            result = self.settings_persistence.team_members_remove(
                user_id=user.get("id"), mail_remove_user=remove_user, mail=mail
            )
            if not result["success"]:
                return {"status": result["error"]}

        return {
            "status": SettingStatus.SUCCESS,
            "invitation_count": self.user_persistence.get_team_members(
                user_id=user.get("id")
            ),
        }

    def timestamp_to_date(self, timestamp):
        return datetime.fromtimestamp(timestamp)

    def calculate_money_contacts_overage(self, overage_leads_count: int) -> str:
        money_contacts_overage = (
            Decimal(overage_leads_count) * self.COST_CONTACT_ON_BASIC_PLAN
        )
        if money_contacts_overage == 0:
            return "0"
        return str(money_contacts_overage.quantize(Decimal("0.01")))

    def extract_subscription_details(
        self, user: User
    ) -> BillingSubscriptionDetails:
        customer_id = user.get("customer_id")
        validation_funds = user.get("validation_funds")
        leads_credits = user.get("leads_credits")
        smart_audience_quota = user.get("smart_audience_quota")
        user_id = user.get("id")
        amount_user_domains = len(
            self.user_domains_service.get_domains(user_id)
        )
        subscription = get_billing_details_by_userid(customer_id)
        user_subscription = self.subscription_service.get_user_subscription(
            user_id=user_id
        )
        current_plan = self.plan_persistence.get_current_plan(user_id=user_id)
        plan_limit_domain = current_plan.domains_limit or -1
        validation_funds_limit = current_plan.validation_funds
        leads_credits_limit = current_plan.leads_credits
        smart_audience_quota_limit = current_plan.smart_audience_quota
        money_contacts_overage = self.calculate_money_contacts_overage(
            overage_leads_count=user.get("overage_leads_count")
        )
        total_key = (
            "monthly_total"
            if current_plan.interval == "month"
            else "yearly_total"
        )
        plan_name = f"{current_plan.title} {'yearly' if current_plan.interval == 'year' else ''}".strip()

        next_billing_date = (
            user_subscription.plan_end.strftime("%b %d, %Y")
            if user.get("source_platform") == "shopify"
            and user_subscription
            and hasattr(user_subscription.plan_end, "strftime")
            else (
                user_subscription.plan_end.strftime("%b %d, %Y")
                if user_subscription
                and hasattr(user_subscription.plan_end, "strftime")
                else None
            )
        )

        total_sum = f"${money_contacts_overage}"

        is_active = (
            subscription.get("status") in ["active", "trialing"]
            if subscription
            else user_subscription.status == "active"
        )

        subscription_details = SubscriptionDetails(
            billing_cycle=BillingCycle(
                detail_type="billing_cycle",
                plan_start=user_subscription.plan_start,
                plan_end=user_subscription.plan_end,
            ),
            plan_name=PlanName(detail_type="as_is", value=plan_name),
            domains=LimitedDetail(
                detail_type="limited",
                limit_value=plan_limit_domain,
                current_value=amount_user_domains,
            ),
            contacts_downloads=LimitedDetail(
                detail_type="limited",
                limit_value=leads_credits_limit,
                current_value=leads_credits,
            ),
            smart_audience=LimitedDetail(
                detail_type="limited",
                limit_value=smart_audience_quota_limit,
                current_value=smart_audience_quota,
            ),
            validation_funds=FundsDetail(
                detail_type="funds",
                limit_value=validation_funds_limit,
                current_value=validation_funds,
            ),
            premium_sources_funds="Coming soon",
            next_billing_date=NextBillingDate(
                detail_type="next_billing_date", value=next_billing_date
            ),
            active=ActivePlan(detail_type="as_is", value=is_active),
        )

        setattr(
            subscription_details,
            total_key,
            TotalKey(detail_type="as_is", value=total_sum),
        )

        billing_detail = BillingSubscriptionDetails(
            subscription_details=subscription_details,
            canceled_at=user_subscription.cancel_scheduled_at,
        )

        return billing_detail

    def get_downgrade_plan(
        self,
        user_subscription: UserSubscriptions,
    ) -> Optional[DowngradePlan]:
        if user_subscription and user_subscription.downgrade_price_id:
            product = get_product_from_price_id(
                user_subscription.downgrade_price_id
            )
            downgrade_time = user_subscription.plan_end.strftime("%b %d, %Y")

            return DowngradePlan(
                plan_name=product.name, downgrade_at=downgrade_time
            )

        return None

    def calculate_final_price(self, subscription, user_subscription):
        plan = subscription["items"]["data"][0]["plan"]
        discount = subscription.get("discount")
        plan_amount = plan["amount"]

        if user_subscription.downgrade_price_id:
            downgrade_plan = get_price_from_price_id(
                user_subscription.downgrade_price_id
            )
            return (
                f"${(downgrade_plan['unit_amount'] / 100):,.0f}"
                if downgrade_plan
                else None
            )

        if user_subscription.cancel_scheduled_at:
            return None

        if discount:
            discount_amount = discount["coupon"].get("amount_off", 0)
            discount_percent = discount["coupon"].get("percent_off", 0)
            if discount_amount:
                final_amount = plan_amount - discount_amount
            elif discount_percent:
                final_amount = plan_amount * (1 - discount_percent / 100)
            else:
                final_amount = plan_amount
        else:
            final_amount = plan_amount

        return f"${(final_amount / 100):,.0f}"

    def get_billing_cards_details(self, customer_id: str):
        return {"card_details": get_card_details_by_customer_id(customer_id)}

    def get_billing(self, user: User):
        result = {}
        current_plan = self.plan_persistence.get_current_plan(
            user_id=user.get("id")
        )
        money_contacts_overage = self.calculate_money_contacts_overage(
            overage_leads_count=user.get("overage_leads_count")
        )

        result["billing_details"] = self.extract_subscription_details(
            user=user
        ).model_dump()
        if user.get("source_platform") == "shopify":
            result["status"] = "hide"
            return result
        result["card_details"] = get_card_details_by_customer_id(
            user.get("customer_id")
        )
        result["billing_details"]["is_leads_auto_charging"] = user.get(
            "is_leads_auto_charging"
        )
        result["usages_credits"] = {
            "leads_credits": user.get("leads_credits"),
            "validation_funds": user.get("validation_funds"),
            "premium_source_credits": user.get("premium_source_credits"),
            "money_because_of_overage": money_contacts_overage,
            "smart_audience_quota": {
                "available": user.get("smart_audience_quota") != 0
                and (
                    current_plan.alias != "free_trial_monthly"
                    or current_plan.alias != "basic"
                ),
                "value": user.get("smart_audience_quota"),
            },
            "plan_leads_credits": current_plan.leads_credits,
            "plan_premium_source_collected": current_plan.premium_source_credits,
            "plan_smart_audience_collected": current_plan.smart_audience_quota,
            "validation_funds_limit": current_plan.validation_funds,
        }
        return result

    def extract_billing_history(self, customer_id, page, per_page):
        result = []
        billing_history, count, max_page = get_billing_history_by_userid(
            customer_id=customer_id, page=page, per_page=per_page
        )

        for billing_data in billing_history:
            billing_hash = {}
            if isinstance(billing_data, stripe.Invoice):
                line_items = billing_data.lines.data
                billing_hash["date"] = self.timestamp_to_date(
                    line_items[0].period.start
                )
                billing_hash["invoice_id"] = billing_data.id
                billing_hash["pricing_plan"] = line_items[0].description
                billing_hash["total"] = billing_data.total / 100
                billing_hash["status"] = self.map_status(billing_data.status)

            elif isinstance(billing_data, stripe.Charge):
                if billing_data.amount <= 0:
                    continue
                line_items = billing_data
                billing_hash["date"] = self.timestamp_to_date(
                    billing_data.created
                )
                billing_hash["invoice_id"] = billing_data.id
                billing_hash["pricing_plan"] = (
                    billing_data.metadata.charge_type.replace("_", " ").title()
                )
                billing_hash["total"] = billing_data.amount / 100
                billing_hash["status"] = self.map_status(billing_data.status)

            result.append(billing_hash)
        result.sort(key=lambda x: x["date"], reverse=True)

        return result, count, max_page

    def map_status(self, status):
        if status in ["succeeded", "paid"]:
            return "Successful"
        elif status == "uncollectible":
            return "Decline"
        else:
            return "Failed"

    def get_billing_history(self, user: dict, page, per_page):
        result = {}
        if user.get("source_platform") == "shopify":
            result["billing_history"], result["count"], result["max_page"] = (
                self.subscription_service.get_billing_history_shopify(
                    user.get("id"), page, per_page
                )
            )
        else:
            result["billing_history"], result["count"], result["max_page"] = (
                self.extract_billing_history(
                    user.get("customer_id"), page, per_page
                )
            )
        return result

    def add_card(self, user: User, payment_method_id, is_default: bool):
        return add_card_to_customer(
            user.get("customer_id"), payment_method_id, is_default=is_default
        )

    def switch_overage(self, user: dict):
        inactive_leads_user = self.lead_persistence.get_inactive_leads_user(
            user.get("id")
        )
        return {
            "contact_count": len(inactive_leads_user),
            "date": inactive_leads_user[0].created_at
            if inactive_leads_user
            else None,
        }

    def delete_card(self, payment_method_id):
        return detach_card_from_customer(payment_method_id)

    def billing_overage(self, user):
        is_leads_auto_charging = self.settings_persistence.billing_overage(
            user_id=user.get("id")
        )
        return {
            "status": SettingStatus.SUCCESS,
            "is_leads_auto_charging": is_leads_auto_charging,
        }

    def get_billing_by_charge_id(self, charge_id):
        return get_billing_by_charge_id(charge_id)

    def send_billing(self, invoice_id, email, user):
        if invoice_id.startswith("ch_"):
            result = get_billing_by_charge_id(invoice_id)
            if result["status"] != "SUCCESS":
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Billing information not found.",
                )
            invoice_number = result["data"].get("id")
            invoice_date = datetime.fromtimestamp(
                result["data"].get("created")
            ).strftime("%B %d, %Y")
            total = result["data"].get("amount") / 100
            link_to_email = result["data"].get("receipt_url", "")

        else:
            result = get_billing_by_invoice_id(invoice_id)
            if result["status"] != "SUCCESS":
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Billing information not found.",
                )

            invoice_number = result["data"].get("id", "")
            invoice_date = datetime.fromtimestamp(
                result["data"].get("created", 0)
            ).strftime("%B %d, %Y")
            total = result["data"].get("amount_due", 0) / 100
            link_to_email = (result["data"].get("hosted_invoice_url", ""),)

        template_id = self.send_grid_persistence.get_template_by_alias(
            SendgridTemplate.PAYMENT_INVOICE_TEMPLATE.value
        )

        mail_object = SendgridHandler()
        mail_object.send_sign_up_mail(
            to_emails=email,
            template_id=template_id,
            template_placeholder={
                "full_name": user.get("full_name", ""),
                "invoice_number": invoice_number,
                "invoice_date": invoice_date,
                "total": f"{total:.2f}",
                "link": link_to_email,
            },
        )

        return SettingStatus.SUCCESS

    def download_billing(self, invoice_id):
        result = get_billing_by_invoice_id(invoice_id)
        if result["status"] != "SUCCESS":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Billing information not found.",
            )

        hosted_invoice_url = result["data"].get("hosted_invoice_url", "")
        return hosted_invoice_url

    def default_card(self, user: dict, payment_method_id):
        return set_default_card_for_customer(
            user.get("customer_id"), payment_method_id
        )

    def get_api_details(self, user):
        get_api_details = self.settings_persistence.get_api_details(
            user.get("id")
        )
        return [
            {
                "api_key": result[0],
                "description": result[1],
                "created_date": result[2],
                "name": result[3],
                "id": result[4],
                "api_id": result[5],
                "last_used_at": result[6],
            }
            for result in get_api_details
        ]

    def delete_api_details(self, user, api_keys_request):
        self.settings_persistence.delete_data_api_details(
            user_id=user.get("id"), api_keys_id=api_keys_request.id
        )
        return SettingStatus.SUCCESS

    def insert_api_details(self, user, api_keys_request):
        self.settings_persistence.insert_data_api_details(
            user_id=user.get("id"), api_keys_request=api_keys_request
        )
        return SettingStatus.SUCCESS

    def change_api_details(self, user, api_keys_request):
        changes = {}

        if api_keys_request.api_key:
            changes["api_key"] = api_keys_request.api_key

        if api_keys_request.api_id:
            changes["api_id"] = api_keys_request.api_id

        if api_keys_request.name:
            changes["name"] = api_keys_request.name
        if api_keys_request.description:
            changes["description"] = api_keys_request.description

        if changes:
            self.settings_persistence.change_columns_data_api_details(
                changes=changes,
                user_id=user.get("id"),
                api_keys_id=api_keys_request.id,
            )
        else:
            changes["last_used_at"] = datetime.now()
            self.settings_persistence.change_columns_data_api_details(
                changes=changes,
                user_id=user.get("id"),
                api_keys_id=api_keys_request.id,
            )
        return SettingStatus.SUCCESS

    def pay_credits(self, user: User, payload: BuyCreditsRequest):
        user_subscription = self.subscription_service.get_user_subscription(
            user_id=user.get("id")
        )
        if not user_subscription:
            logger.error(f"Subscription not found for user {user.get('id')}")
            return
        credit_plan = self.plan_persistence.get_subscription_plan_by_id(
            id=user_subscription.contact_credit_plan_id
        )
        result = purchase_product(
            customer_id=user.get("customer_id"),
            price_id=credit_plan.stripe_price_id,
            quantity=user.get("overage_leads_count"),
            product_description="Charge overage credits",
            charge_type="contacts_overage",
            payment_method_id=payload.payment_method_id,
        )
        if result["success"]:
            event = result["stripe_payload"]
            customer_id = event["customer"]
            self.user_persistence.decrease_overage_leads_count(
                customer_id=customer_id,
                quantity=event["metadata"]["quantity"],
            )
            self.subscription_service.update_subscription_status(
                customer_id=customer_id, status=PaymentStatus.ACTIVE.value
            )
            return {"success": True}

        return result

    def buy_funds(self, user: User, payload: BuyFundsRequest):
        metadata = {
            "user_id": str(user.get("id")),
            "type_funds": payload.type_funds.value,
            "amount_usd": str(payload.amount),
            "charge_type": "buy_funds",
        }

        result = self.stripe_service.charge_customer_immediately(
            customer_id=user.get("customer_id"),
            amount_usd=payload.amount,
            currency="usd",
            description="Buy funds",
            metadata=metadata,
            payment_method_id=payload.payment_method_id,
        )

        if result["success"]:
            event = result["stripe_payload"]
            self.user_persistence.increase_funds_count(
                customer_id=event["customer"],
                quantity=payload.amount,
                type_funds=payload.type_funds,
            )
            return {"success": True}

        return result

    def get_all_plans(self) -> PlansResponse:
        FREE_TRAIL_PLAN = Plan(
            title="Free Trial",
            alias="free_trial",
            price=Price(value="$0", y="month"),
            permanent_limits=[
                Advantage(
                    good=True, name="Domains monitored:", value="Unlimited"
                )
            ],
            monthly_limits=[
                Advantage(
                    good=True, name="Contact Downloads:", value="Up to 1,000"
                ),
                Advantage(good=False, name="Smart Audience:", value="0"),
            ],
            gifted_funds=[
                Advantage(good=True, name="Validation funds:", value="$250"),
                Advantage(
                    good=True, name="Premium Source funds:", value="$250"
                ),
            ],
        )

        BASIC = Plan(
            title="Basic",
            alias="basic",
            price=Price(value="$0,08", y="record"),
            is_recommended=True,
            permanent_limits=[
                Advantage(
                    good=True, name="Domains monitored:", value="Unlimited"
                )
            ],
            monthly_limits=[
                Advantage(
                    good=True, name="Contact Downloads:", value="500 – 65,000"
                ),
                Advantage(good=False, name="Smart Audience:", value="0"),
            ],
            gifted_funds=[
                Advantage(good=True, name="Validation funds:", value="$500"),
                Advantage(
                    good=True, name="Premium Source funds:", value="$500"
                ),
            ],
        )

        SMART_AUDIENCE_YEARLY = Plan(
            title="Smart Audience",
            alias="smart_audience",
            price=Price(value="$5,000", y="month"),
            permanent_limits=[
                Advantage(
                    good=True, name="Domains monitored:", value="Unlimited"
                )
            ],
            monthly_limits=[
                Advantage(
                    good=True, name="Contact Downloads:", value="Unlimited"
                ),
                Advantage(good=True, name="Smart Audience:", value="200,000"),
            ],
            gifted_funds=[
                Advantage(good=True, name="Validation funds:", value="$2,500"),
                Advantage(
                    good=True, name="Premium Source funds:", value="$2,500"
                ),
            ],
        )

        SMART_AUDIENCE_MONTHLY = SMART_AUDIENCE_YEARLY.model_copy(
            update={"price": Price(value="$7,500", y="month")}
        )

        PRO_YEARLY = Plan(
            title="Pro",
            alias="pro",
            price=Price(value="$10,000", y="month"),
            permanent_limits=[
                Advantage(
                    good=True, name="Domains monitored:", value="Unlimited"
                )
            ],
            monthly_limits=[
                Advantage(
                    good=True, name="Contact Downloads:", value="Unlimited"
                ),
                Advantage(good=True, name="Smart Audience:", value="Unlimited"),
            ],
            gifted_funds=[
                Advantage(good=True, name="Validation funds:", value="$5,000"),
                Advantage(
                    good=True, name="Premium Source funds:", value="$5,000"
                ),
            ],
        )

        PRO_MONTHLY = PRO_YEARLY.model_copy(
            update={"price": Price(value="$15,000", y="month")}
        )

        YEARLY_PLANS = [
            FREE_TRAIL_PLAN,
            BASIC,
            SMART_AUDIENCE_YEARLY,
            PRO_YEARLY,
        ]
        MONTHLY_PLANS = [
            FREE_TRAIL_PLAN,
            BASIC,
            SMART_AUDIENCE_MONTHLY,
            PRO_MONTHLY,
        ]
        return PlansResponse(monthly=MONTHLY_PLANS, yearly=YEARLY_PLANS)
