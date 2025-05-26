from datetime import datetime, timezone

from sqlalchemy import Column, ForeignKey, VARCHAR, NUMERIC, BigInteger, Sequence
from sqlalchemy.dialects.postgresql import TIMESTAMP

from .base import Base


class SubscriptionTransactions(Base):
    __tablename__ = 'subscription_transactions'

    id = Column(
        BigInteger,
        Sequence('user_subscription_plan_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    user_id = Column(
        BigInteger,
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=True
    )
    plan_id = Column(
        BigInteger,
        ForeignKey('subscription_plans.id', ondelete='CASCADE'),
        nullable=True
    )
    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    platform_subscription_id = Column(
        VARCHAR,
        nullable=True
    )
    stripe_request_created_at = Column(
        VARCHAR,
        nullable=True
    )
    transaction_id = Column(
        VARCHAR,
        nullable=True
    )
    charge_id = Column(
        VARCHAR,
        nullable=True
    )
    status = Column(
        VARCHAR,
        nullable=True
    )
    plan_name = Column(
        VARCHAR,
        nullable=True
    )
    start_date = Column(
        TIMESTAMP,
        nullable=True
    )
    end_date = Column(
        TIMESTAMP,
        nullable=True
    )
    currency = Column(
        VARCHAR,
        nullable=True
    )
    price_id = Column(
        VARCHAR,
        nullable=True
    )
    amount = Column(
        NUMERIC(10, 2),
        nullable=True
    )

