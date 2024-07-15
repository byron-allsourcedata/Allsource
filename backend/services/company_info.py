import logging

from enums import CompanyInfoEnum
from models.users import Users
from sqlalchemy.orm import Session

from schemas.users import CompanyInfo

logger = logging.getLogger(__name__)


class CompanyInfoService:
    def __init__(self, db: Session, user: Users):
        self.user = user
        self.db = db

    def set_company_info(self, company_info: CompanyInfo):
        if self.user.is_with_card and not self.user.is_email_confirmed:
            return CompanyInfoEnum.NEED_EMAIL_VERIFIED
        self.db.query(Users).filter(Users.id == self.user.id).update(
            {Users.company_name: company_info.organization_name, Users.company_website: company_info.company_website,
             Users.company_email_address: company_info.email_address, Users.employees_workers: company_info.employees_workers},
            synchronize_session=False)
        self.db.commit()
        return CompanyInfoEnum.SUCCESS
