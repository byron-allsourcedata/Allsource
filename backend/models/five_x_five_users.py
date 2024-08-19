from sqlalchemy import Column, Integer, TEXT, VARCHAR

from .base import Base


class FiveXFiveUser(Base):
    __tablename__ = '5x5_users'

    id = Column(Integer, primary_key=True)
    up_id = Column(VARCHAR, nullable=True)
    cc_id = Column(VARCHAR, nullable=True)
    first_name = Column(VARCHAR, nullable=True)
    programmatic_business_emails = Column(TEXT, nullable=True)
    mobile_phone = Column(TEXT, nullable=True)
    direct_number = Column(TEXT, nullable=True)
    gender = Column(VARCHAR, nullable=True)
    age_range = Column(VARCHAR, nullable=True)
    personal_phone = Column(VARCHAR, nullable=True)
    business_email = Column(VARCHAR, nullable=True)
    last_name = Column(VARCHAR, nullable=True)
    personal_city = Column(VARCHAR, nullable=True)
    personal_state = Column(VARCHAR, nullable=True)
    company_name = Column(VARCHAR, nullable=True)
    company_domain = Column(VARCHAR, nullable=True)
    company_phone = Column(VARCHAR, nullable=True)
    company_sic = Column(VARCHAR, nullable=True)
    company_address = Column(VARCHAR, nullable=True)
    company_city = Column(VARCHAR, nullable=True)
    company_state = Column(VARCHAR, nullable=True)
    company_zip = Column(VARCHAR, nullable=True)
    company_linkedin_url = Column(VARCHAR, nullable=True)
    company_revenue = Column(VARCHAR, nullable=True)
    company_employee_count = Column(VARCHAR, nullable=True)
    net_worth = Column(VARCHAR, nullable=True)
    job_title = Column(VARCHAR, nullable=True)
