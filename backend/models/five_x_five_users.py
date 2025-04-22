from sqlalchemy import Column, Integer, TEXT, Index, VARCHAR, TIMESTAMP, Sequence, String, Text, BigInteger, ForeignKey

from .base import Base


class FiveXFiveUser(Base):
    __tablename__ = '5x5_users'
    __table_args__ = (
        Index('5x5_users_company_alias_idx', 'company_alias'),
        Index('5x5_users_company_domain_idx', 'company_domain'),
        Index('5x5_users_company_name_idx', 'company_name'),
        Index('5x5_users_department_idx', 'department'),
        Index('5x5_users_job_title_idx', 'job_title'),
        Index('5x5_users_linkedin_url_idx', 'linkedin_url'),
        Index('5x5_users_seniority_level_idx', 'seniority_level'),
        Index('5x5_users_up_id_idx', 'up_id', unique=True),
    )

    id = Column(
        Integer,
        Sequence('5x5_users_id_seq'),
        primary_key=True,
        nullable=False
    )
    up_id = Column(String(64), nullable=True)
    cc_id = Column(String(64), nullable=True)
    first_name = Column(String(64), nullable=True)
    last_name = Column(String(64), nullable=True)
    business_email = Column(String(64), nullable=True)
    programmatic_business_emails = Column(Text, nullable=True)
    mobile_phone = Column(Text, nullable=True)
    direct_number = Column(Text, nullable=True)
    personal_phone = Column(Text, nullable=True)
    linkedin_url = Column(String(256), nullable=True)
    personal_address = Column(String(256), nullable=True)
    personal_address_2 = Column(String(256), nullable=True)
    personal_city = Column(String(64), nullable=True)
    personal_state = Column(String(8), nullable=True)
    personal_zip = Column(String(16), nullable=True)
    personal_zip4 = Column(String(16), nullable=True)
    personal_emails = Column(String(64), nullable=True)
    additional_personal_emails = Column(Text, nullable=True)
    gender = Column(String(4), nullable=True)
    married = Column(String(4), nullable=True)
    children = Column(String(16), nullable=True)
    income_range = Column(String(256), nullable=True)
    net_worth = Column(String(256), nullable=True)
    homeowner = Column(String(4), nullable=True)
    job_title = Column(String(256), nullable=True)
    seniority_level = Column(String(64), nullable=True)
    department = Column(String(64), nullable=True)
    professional_address = Column(String(256), nullable=True)
    professional_address_2 = Column(String(256), nullable=True)
    professional_city = Column(String(64), nullable=True)
    professional_state = Column(String(64), nullable=True)
    professional_zip = Column(String(8), nullable=True)
    professional_zip4 = Column(String(8), nullable=True)
    company_name = Column(String(128), nullable=True)
    company_domain = Column(String(128), nullable=True)
    company_phone = Column(String(128), nullable=True)
    company_sic = Column(String(512), nullable=True)
    company_address = Column(String(256), nullable=True)
    company_city = Column(String(64), nullable=True)
    company_state = Column(String(64), nullable=True)
    company_zip = Column(String(8), nullable=True)
    company_linkedin_url = Column(String(256), nullable=True)
    company_revenue = Column(String(64), nullable=True)
    company_employee_count = Column(String(64), nullable=True)
    primary_industry = Column(String(128), nullable=True)
    business_email_validation_status = Column(String(64), nullable=True)
    business_email_last_seen = Column(TIMESTAMP, nullable=True)
    personal_emails_validation_status = Column(String(64), nullable=True)
    work_history = Column(Text, nullable=True)
    education_history = Column(Text, nullable=True)
    company_description = Column(Text, nullable=True)
    related_domains = Column(String(128), nullable=True)
    social_connections = Column(String(32), nullable=True)
    dpv_code = Column(String(2), nullable=True)
    last_updated = Column(TIMESTAMP, nullable=True)
    personal_emails_last_seen = Column(TIMESTAMP, nullable=True)
    company_last_updated = Column(TIMESTAMP, nullable=True)
    job_title_last_updated = Column(TIMESTAMP, nullable=True)
    first_name_id = Column(
        BigInteger,
        ForeignKey('5x5_names.id', ondelete='CASCADE', onupdate='CASCADE'),
        nullable=True
    )
    last_name_id = Column(
        BigInteger,
        ForeignKey('5x5_names.id', ondelete='CASCADE', onupdate='CASCADE'),
        nullable=True
    )
    age_min = Column(Integer, nullable=True)
    age_max = Column(Integer, nullable=True)
    company_alias = Column(String(256), nullable=True)
