import logging

from enums import CompanyInfoEnum
from models.users import Users
from models.users_domains import UserDomains
from sqlalchemy.orm import Session
from enums import SourcePlatformEnum
from schemas.users import CompanyInfo
from services.subscriptions import SubscriptionService
from persistence.partners_persistence import PartnersPersistence

logger = logging.getLogger(__name__)


class CompanyInfoService:
    def __init__(self, db: Session, user, subscription_service: SubscriptionService, partners_persistence: PartnersPersistence):
        self.user = user
        self.db = db
        self.subscription_service = subscription_service
        self.partners_persistence = partners_persistence

    def set_company_info(self, company_info: CompanyInfo):
        result = self.check_company_info_authorization()
        if result == CompanyInfoEnum.SUCCESS:
            if not self.user.get('is_with_card') and not self.user.get('is_email_confirmed'):
                return {'status': CompanyInfoEnum.NEED_EMAIL_VERIFIED}
            user = self.db.query(Users).filter(Users.id == self.user.get('id')).first()
            user.company_name = company_info.organization_name
            user.company_website = company_info.company_website
            user.employees_workers = company_info.employees_workers
            user.company_role = company_info.company_role
            user.company_website_visits = company_info.monthly_visits
            user.is_company_details_filled = True
            self.db.flush()
            self.partners_persistence.update_partner_info(company_info.email, company_info.fullName, company_info.organization_name)
            if self.user.get('source_platform') not in (SourcePlatformEnum.SHOPIFY.value, SourcePlatformEnum.BIG_COMMERCE.value):
                self.db.add(UserDomains(user_id=self.user.get('id'),
                                        domain=company_info.company_website.replace('https://', '').replace('http://', '')))
            self.db.commit()
            return {
                'status': CompanyInfoEnum.SUCCESS,
                'stripe_payment_url': user.stripe_payment_url
                    }
        else:
            return {'status': result}

    def get_company_info(self):
        result = {}
        if self.user.get('source_platform') in (SourcePlatformEnum.SHOPIFY.value, SourcePlatformEnum.BIG_COMMERCE.value):
            result['domain_url'] = self.db.query(UserDomains.domain).filter_by(user_id=self.user.get('id')).scalar()
        result['status'] = self.check_company_info_authorization()
        return result

    def check_company_info_authorization(self):
        if self.user.get('is_with_card'):
            if self.user.get('company_name'):
                subscription_plan_exists = self.subscription_service.is_user_have_subscription(self.user.get('id'))
                if subscription_plan_exists:
                    return CompanyInfoEnum.DASHBOARD_ALLOWED
                return CompanyInfoEnum.NEED_CHOOSE_PLAN
            else:
                return CompanyInfoEnum.SUCCESS
        else:
            if self.user.get('is_email_confirmed'):
                if self.user.get('company_name'):
                    return CompanyInfoEnum.DASHBOARD_ALLOWED
                return CompanyInfoEnum.SUCCESS
            else:
                return CompanyInfoEnum.NEED_EMAIL_VERIFIED
