from sqlalchemy import Column, Integer, ForeignKey, PrimaryKeyConstraint, UniqueConstraint, BigInteger
from .base import Base


class LeadUserCompany(Base):
    __tablename__ = 'leads_users_companies'
    __table_args__ = (
        PrimaryKeyConstraint('lead_company_id', 'first_lead_user_id', name='leads_users_companies_pkey'),
        UniqueConstraint('lead_company_id', 'first_lead_user_id',
                         name='leads_users_companies_lead_company_id_lead_user_id_idx'),
    )

    lead_company_id = Column(
        BigInteger,
        ForeignKey('leads_companies.id', ondelete='CASCADE'),
        nullable=False
    )
    first_lead_user_id = Column(
        BigInteger,
        ForeignKey('leads_users.id', ondelete='CASCADE'),
        nullable=False
    )
