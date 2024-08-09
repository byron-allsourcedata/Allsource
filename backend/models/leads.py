from sqlalchemy import Column, Integer, VARCHAR
from .base import Base


class Lead(Base):
    __tablename__ = 'leads'

    id = Column(Integer, primary_key=True)
    first_name = Column(VARCHAR, nullable=True)
    up_id = Column(VARCHAR, nullable=False)
    mobile_phone = Column(VARCHAR, nullable=True)
    business_email = Column(VARCHAR, nullable=True)
    last_name = Column(VARCHAR, nullable=True)
    trovo_id = Column(VARCHAR, nullable=True)
    partner_id = Column(VARCHAR, nullable=True)
    partner_uid = Column(VARCHAR, nullable=True)
    sha256_lower_case = Column(VARCHAR, nullable=True)
    ip = Column(VARCHAR, nullable=True)
    time_spent = Column(VARCHAR, nullable=True)
    no_of_visits = Column(Integer, nullable=True)
    no_of_page_visits = Column(Integer, nullable=True)
    age_min = Column(Integer, nullable=True)
    age_max = Column(Integer, nullable=True)
    gender = Column(VARCHAR(1), nullable=True)
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
