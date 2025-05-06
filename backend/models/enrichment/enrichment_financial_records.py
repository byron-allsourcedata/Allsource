from sqlalchemy import Column, String, Text, SmallInteger, ForeignKey, text, Index
from sqlalchemy.dialects.postgresql import UUID
from models.base import Base


class EnrichmentFinancialRecord(Base):
    __tablename__ = 'enrichment_financial_records'
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    asid = Column(
        UUID(as_uuid=True),
        ForeignKey('enrichment_users.asid', ondelete='CASCADE', onupdate='CASCADE'),
        nullable=False
    )
    income_range = Column(String(10), nullable=True)
    net_worth = Column(String(10), nullable=True)
    credit_rating = Column(String(1), nullable=True)
    credit_cards = Column(Text, nullable=True)
    bank_card = Column(String(8), nullable=False)
    credit_card_premium = Column(String(8), nullable=False)
    credit_card_new_issue = Column(String(8), nullable=False)
    credit_lines = Column(String(8), nullable=False)
    credit_range_of_new_credit_lines = Column(String(8), nullable=False)
    donor = Column(String(8), nullable=False)
    investor = Column(String(8), nullable=False)
    mail_order_donor = Column(String(8), nullable=False)
    
    __table_args__ = (
        Index("ix_financial_asid", asid),
    )
