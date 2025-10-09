import logging

from enums import CompanyInfoEnum
from utils.strings import normalize_host_raw
from models.users import Users
from sqlalchemy.orm import Session
from enums import SourcePlatformEnum
from schemas.users import CompanyInfo
from services.subscriptions import SubscriptionService
from persistence.partners_persistence import PartnersPersistence
from persistence.account_setup import AccountSetupPersistence
from services.stripe_service import get_stripe_payment_url
from resolver import injectable

logger = logging.getLogger(__name__)

PUBLIC_EMAIL_HOSTS = {
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "yahoo.co.uk",
    "yandex.ru",
    "yandex.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "mail.ru",
    "protonmail.com",
    "qq.com",
    "163.com",
    "126.com",
    "sina.com",
}


class CompanyInfoService:
    def __init__(
        self,
        db: Session,
        user,
        subscription_service: SubscriptionService,
        partners_persistence: PartnersPersistence,
        account_setup_persistence: AccountSetupPersistence,
    ):
        self.user = user
        self.db = db
        self.subscription_service = subscription_service
        self.account_setup_persistence = account_setup_persistence
        self.partners_persistence = partners_persistence

    def set_company_info(self, company_info: CompanyInfo):
        result = self.check_company_info_authorization()
        if result == CompanyInfoEnum.SUCCESS:
            if not self.user.get("is_with_card") and not self.user.get(
                "is_email_confirmed"
            ):
                return {"status": CompanyInfoEnum.NEED_EMAIL_VERIFIED}

            user = (
                self.db.query(Users)
                .filter(Users.id == self.user.get("id"))
                .first()
            )
            has_exist_team = self.account_setup_persistence.has_exist_team(
                company_name=company_info.organization_name
            )
            if has_exist_team:
                return {"status": CompanyInfoEnum.COMPANY_NAME_ALREADY_EXIST}
            user.company_website = company_info.company_website
            user.company_name = company_info.organization_name
            user.is_company_details_filled = True
            self.db.commit()
            stripe_payment_url = None
            if user.stripe_payment_url:
                stripe_payment_url = get_stripe_payment_url(
                    user.customer_id, user.stripe_payment_url
                )
            return {
                "status": CompanyInfoEnum.SUCCESS,
                "stripe_payment_url": stripe_payment_url,
            }
        else:
            return {"status": result}

    def get_company_info(self):
        result = {}
        if self.user.get("source_platform") in (
            SourcePlatformEnum.SHOPIFY.value,
            SourcePlatformEnum.BIG_COMMERCE.value,
        ):
            result["domain_url"] = (
                self.user.get("company_website")
                .replace("https://", "")
                .replace("http://", "")
            )
            result["company_name"] = self.user.get("company_name")
        result["status"] = self.check_company_info_authorization()
        return result

    def _extract_host_from_email(self, email: str) -> str:
        if not email or "@" not in email:
            return ""
        host = email.split("@", 1)[1]
        return normalize_host_raw(host)

    def _is_public_host(self, host: str) -> bool:
        hn = normalize_host_raw(host)
        return hn in PUBLIC_EMAIL_HOSTS

    def get_potential_team_members(self, user_email: str, user_id: int):
        host = self._extract_host_from_email(user_email)
        if not host:
            return []

        if self._is_public_host(host):
            return []

        by_email = self.account_setup_persistence.find_by_email_host(
            host, user_id
        )
        if by_email:
            return by_email

        res_domains = self.account_setup_persistence.find_by_users_domains(
            host, user_id
        )
        res_sites = self.account_setup_persistence.find_by_company_website(
            host, user_id
        )

        combined = []
        seen_ids = set()
        for r in res_domains + res_sites:
            if r.id not in seen_ids:
                combined.append(r)
                seen_ids.add(r.id)

        return combined

    def check_company_info_authorization(self):
        if self.user.get("is_with_card"):
            if self.user.get("company_website"):
                subscription_plan_exists = self.user.get(
                    "current_subscription_id"
                )
                if subscription_plan_exists:
                    return CompanyInfoEnum.DASHBOARD_ALLOWED
                return CompanyInfoEnum.NEED_CHOOSE_PLAN
            else:
                return CompanyInfoEnum.SUCCESS
        else:
            if self.user.get("is_email_confirmed"):
                # if self.user.get("company_website"):
                #     return CompanyInfoEnum.DASHBOARD_ALLOWED
                return CompanyInfoEnum.SUCCESS
            else:
                return CompanyInfoEnum.NEED_EMAIL_VERIFIED
