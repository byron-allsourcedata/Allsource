from sqlalchemy import Column, Integer, VARCHAR, Index, TIMESTAMP, TEXT, ForeignKey
from .base import Base


class LeadCompany(Base):
    __tablename__ = 'leads_companies'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(VARCHAR(256))
    alias = Column(VARCHAR(256))
    domain = Column(VARCHAR(256), nullable=True)
    phone = Column(VARCHAR(256), nullable=True)
    sic = Column(VARCHAR(256), nullable=True)
    address = Column(VARCHAR(256), nullable=True)
    five_x_five_location_id = Column(Integer, ForeignKey('users_domains.id'), nullable=True)
    zip = Column(VARCHAR(64), nullable=True)
    linkedin_url = Column(VARCHAR(256), nullable=True)
    revenue = Column(VARCHAR(256), nullable=True)
    employee_count = Column(VARCHAR(128), nullable=True)
    last_updated = Column(TIMESTAMP, nullable=True)
    description = Column(TEXT, nullable=True)
    primary_industry = Column(VARCHAR(256), nullable=True)
    
    __table_args__ = (
        Index('leads_companies_alias_idx', 'alias'),
    )

