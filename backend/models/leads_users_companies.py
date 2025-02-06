from sqlalchemy import Column, Integer, ForeignKey, PrimaryKeyConstraint
from .base import Base


class LeadUserCompany(Base):
    __tablename__ = 'leads_users_companies'
    
    lead_company_id = Column(Integer, ForeignKey('leads_companies.id'), nullable=False)
    lead_user_id = Column(Integer, ForeignKey('leads_users.id'), nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint('lead_company_id', 'lead_user_id'),
    )
