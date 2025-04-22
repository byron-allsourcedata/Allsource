from sqlalchemy import Column, String, Text, SmallInteger, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from .base import Base


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
        ForeignKey('enrichment_user_ids.asid', ondelete='CASCADE', onupdate='CASCADE'),
        nullable=False
    )
    income_range = Column(String(10), nullable=True)
    net_worth = Column(String(10), nullable=True)
    credit_rating = Column(String(1), nullable=True)
    credit_cards = Column(Text, nullable=True)
    bank_card = Column(SmallInteger, nullable=True)
    credit_card_premium = Column(SmallInteger, nullable=True)
    credit_card_new_issue = Column(SmallInteger, nullable=True)
    credit_lines = Column(String(1), nullable=True)
    credit_range_of_new_credit_lines = Column(String(1), nullable=True)
    donor = Column(SmallInteger, nullable=True)
    investor = Column(SmallInteger, nullable=True)
    mail_order_donor = Column(SmallInteger, nullable=True)
