from sqlalchemy import Column, Integer
from sqlalchemy.dialects.postgresql import VARCHAR
from .base import Base


class Lead(Base):
    __tablename__ = 'leads'

    id = Column(Integer, primary_key=True)
    first_name = Column(VARCHAR)
    up_id = Column(VARCHAR)
    mobile_phone = Column(VARCHAR)
    business_email = Column(VARCHAR)
    last_name = Column(VARCHAR)
    trovo_id = Column(VARCHAR)
    partner_id = Column(VARCHAR)
    partner_uid = Column(VARCHAR)
    sha256_lower_case = Column(VARCHAR)
    ip = Column(VARCHAR)
    time_spent = Column(VARCHAR)
    no_of_visits = Column(Integer)
    no_of_page_visits = Column(Integer)
    age_min = Column(Integer)
    age_max = Column(Integer)
    gender = Column(VARCHAR(1))
    company_name = Column(VARCHAR)
    company_domain = Column(VARCHAR)
    company_phone = Column(VARCHAR)
    company_sic = Column(VARCHAR)
    company_address = Column(VARCHAR)
    company_city = Column(VARCHAR)
    company_state = Column(VARCHAR)
    company_zip = Column(VARCHAR)
    company_linkedin_url = Column(VARCHAR)
    company_revenue = Column(VARCHAR)
    company_employee_count = Column(VARCHAR)
    net_worth = Column(VARCHAR)
    job_title = Column(VARCHAR)
