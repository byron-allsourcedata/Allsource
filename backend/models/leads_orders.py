from sqlalchemy import Column, Integer, VARCHAR, DECIMAL, TIMESTAMP, BigInteger, text, ForeignKey, Numeric, Sequence
from datetime import datetime, timezone
from .base import Base


class LeadOrders(Base):
    __tablename__ = 'leads_orders'

    id = Column(
        BigInteger,
        Sequence('leads_orders_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    platform_user_id = Column(BigInteger, nullable=True)
    lead_user_id = Column(
        BigInteger,
        ForeignKey('leads_users.id', ondelete='CASCADE'),
        nullable=True
    )
    platform_order_id = Column(BigInteger, nullable=True)
    currency_code = Column(VARCHAR(8), nullable=True)
    total_price = Column(Numeric(10, 2), nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    platform_created_at = Column(TIMESTAMP, nullable=True)
    platform = Column(VARCHAR, nullable=True)
    platfrom_email = Column(VARCHAR, nullable=True)
