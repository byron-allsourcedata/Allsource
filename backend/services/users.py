import logging
from typing import Optional

from enums import UpdatePasswordStatus
from models import Users
from persistence.user_persistence import UserPersistence
from persistence.plans_persistence import PlansPersistence
from schemas.users import UpdatePassword, MeetingData
from schemas.domains import DomainResponse, DomainWithStats
from services.jwt_service import get_password_hash
from dotenv import load_dotenv

from persistence.leads_persistence import LeadsPersistence
from services.meeting_schedule import MeetingScheduleService
from services.subscriptions import SubscriptionService
from persistence.domains import UserDomainsPersistence, UserDomains


logger = logging.getLogger(__name__)
load_dotenv()


class UsersService:
    def __init__(
        self,
        user: dict,
        user_persistence_service: UserPersistence,
        plan_persistence: PlansPersistence,
        subscription_service: SubscriptionService,
        domain_persistence: UserDomainsPersistence,
        leads_persistence: LeadsPersistence,
        meeting_schedule: MeetingScheduleService,
    ):
        self.user = user
        self.user_persistence_service = user_persistence_service
        self.plan_persistence = plan_persistence
        self.subscription_service = subscription_service
        self.domain_persistence = domain_persistence
        self.leads_persistence = leads_persistence
        self.meeting_schedule = meeting_schedule

    def update_password(self, update_data: UpdatePassword):
        if update_data.password != update_data.confirm_password:
            return UpdatePasswordStatus.PASSWORDS_DO_NOT_MATCH
        update_data.password = get_password_hash(update_data.password)
        logger.info("update password success")
        self.user_persistence_service.update_password(
            self.user.get("id"), update_data.password
        )
        return UpdatePasswordStatus.PASSWORD_UPDATED_SUCCESSFULLY

    def get_info_plan(self):
        if not self.user.get("is_book_call_passed") and not self.user.get(
            "is_with_card"
        ):
            return {"is_trial_pending": True}
        result = (
            self.subscription_service.get_user_subscription_with_trial_status(
                self.user.get("id")
            )
        )
        if result["subscription"]:
            return {
                "is_artificial_status": result["is_artificial_status"],
                "is_trial": result["subscription"].is_trial,
                "plan_end": result["subscription"].plan_end,
                "lead_credits": result["lead_credits"],
                "validation_funds": result["validation_funds"],
                "plan_alias": result["alias"],
            }
        return {"is_trial_pending": True}

    def get_my_info(self):
        team_member = self.user.get("team_member")

        info = {
            "is_partner": self.user.get("is_partner"),
            "business_type": self.user.get("business_type"),
            "source_platform": self.user.get("source_platform"),
            "leads_credits": self.user.get("leads_credits"),
            "validation_funds": self.user.get("validation_funds"),
            "has_active_plan": bool(self.user.get("current_subscription_id")),
        }

        if team_member:
            info["email"] = team_member.get("email")
            info["full_name"] = team_member.get("full_name")
            info["access_level"] = team_member.get("team_access_level")
        else:
            info["email"] = self.user.get("email")
            info["full_name"] = self.user.get("full_name")

        return info

    def get_domain_with_stats(
        self,
        domain: UserDomains,
        activate_percent,
        is_current_subscription_id,
        contacts_resolving_ids: set[int],
        data_synced_ids: set[int],
        data_sync_failed_ids: set[int],
    ) -> DomainWithStats:
        domain_percent = 0
        if domain.is_pixel_installed:
            domain_percent = 75
        else:
            if activate_percent and activate_percent > 0:
                domain_percent = activate_percent
            elif is_current_subscription_id:
                domain_percent = 50

        domain_data = self.domain_mapped(domain)

        return DomainWithStats(
            **domain_data.dict(),
            activate_percent=domain_percent,
            contacts_resolving=domain.id in contacts_resolving_ids,
            data_synced=domain.id in data_synced_ids,
            data_sync_failed=domain.id in data_sync_failed_ids,
        )

    def get_domains(self):
        user_id = self.user.get("id")
        domains = self.domain_persistence.get_domains_by_user(user_id)

        contacts_resolving_ids = (
            self.domain_persistence.get_domains_with_contacts_resolving(user_id)
        )
        data_synced_ids = self.domain_persistence.get_domains_with_data_synced(
            user_id
        )
        data_sync_failed_ids = (
            self.domain_persistence.get_domains_with_failed_data_sync(user_id)
        )

        enabled_domains = [domain for domain in domains if domain.is_enable]
        disabled_domains = [
            domain for domain in domains if not domain.is_enable
        ]

        enabled_domains_sorted = sorted(
            enabled_domains, key=lambda x: (x.created_at, x.id)
        )
        disabled_domains_sorted = sorted(
            disabled_domains, key=lambda x: (x.created_at, x.id)
        )
        sorted_domains = enabled_domains_sorted + disabled_domains_sorted

        return [
            self.get_domain_with_stats(
                domain,
                self.user.get("activate_steps_percent"),
                self.user.get("current_subscription_id"),
                contacts_resolving_ids,
                data_synced_ids,
                data_sync_failed_ids,
            )
            for domain in sorted_domains
        ]

    def domain_mapped(self, domain: UserDomains) -> DomainResponse:
        return DomainResponse(
            id=domain.id,
            domain=domain.domain,
            data_provider_id=domain.data_provider_id,
            is_pixel_installed=domain.is_pixel_installed,
            enable=domain.is_enable,
            is_add_to_cart_installed=domain.is_add_to_cart_installed,
            is_converted_sales_installed=domain.is_converted_sales_installed,
            is_view_product_installed=domain.is_view_product_installed,
        )

    def get_meeting_info(self) -> MeetingData:
        return self.meeting_schedule.get_meeting_info(self.user)

    def add_stripe_account(self, stripe_connected_account_id: str):
        self.user_persistence_service.add_stripe_account(
            self.user.get("id"), stripe_connected_account_id
        )
        return "SUCCESS_CONNECT"

    def check_source_import(self):
        return self.user_persistence_service.has_sources_for_user(
            self.user.get("id")
        )

    def by_email(self, email: str) -> Optional[Users]:
        return self.user_persistence_service.by_email(email)
