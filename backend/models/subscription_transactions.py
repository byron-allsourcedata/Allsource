from sqlalchemy import Column, ForeignKey, event, Integer, VARCHAR, DECIMAL, NUMERIC, BigInteger, text
from sqlalchemy.dialects.postgresql import BIGINT, TIMESTAMP

from .base import Base, create_timestamps, update_timestamps


class SubscriptionTransactions(Base):
    __tablename__ = 'subscription_transactions'

    id = Column(
        BigInteger,
        primary_key=True,
        nullable=False,
        server_default=text("nextval('user_subscription_plan_id_seq'::regclass)")
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
    created_at = Column(
        TIMESTAMP(precision=6),
        nullable=True
    )
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


event.listen(SubscriptionTransactions, "before_insert", create_timestamps)
event.listen(SubscriptionTransactions, "before_update", update_timestamps)
