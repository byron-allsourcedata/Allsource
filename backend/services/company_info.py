import logging

from enums import CompanyInfoEnum
from models.plans import UserSubscriptionPlan
from models.users import Users
from sqlalchemy.orm import Session

from schemas.users import CompanyInfo
from services.subscriptions import SubscriptionService

logger = logging.getLogger(__name__)


class CompanyInfoService:
    def __init__(self, db: Session, user, subscription_service: SubscriptionService):
        self.user = user
        self.db = db
        self.subscription_service = subscription_service


    def set_company_info(self, company_info: CompanyInfo):
        result = self.check_company_info_authorization()
        if result == CompanyInfoEnum.SUCCESS:
            if not self.user.get('is_with_card') and not self.user.get('is_email_confirmed'):
                return CompanyInfoEnum.NEED_EMAIL_VERIFIED
            self.db.query(Users).filter(Users.id == self.user.get('id')).update(
                {Users.company_name: company_info.organization_name, Users.company_website: company_info.company_website,
                 Users.employees_workers: company_info.employees_workers,
                 Users.company_role: company_info.company_role,
                 Users.company_website_visits: company_info.monthly_visits},
                synchronize_session=False)
            self.db.commit()
            return CompanyInfoEnum.SUCCESS
        else:
            return result

    def get_company_info(self):
        return self.check_company_info_authorization()

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
