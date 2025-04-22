from sqlalchemy import Column, ForeignKey, Integer, BOOLEAN, TEXT, event, Index, BigInteger, text, Boolean
from sqlalchemy.dialects.postgresql import BIGINT, TIMESTAMP, VARCHAR
from .base import Base, create_timestamps, update_timestamps


class UserSubscriptions(Base):
    __tablename__ = 'user_subscriptions'
    __table_args__ = (
        Index('user_subscriptions_contact_credit_plan_id_idx', 'contact_credit_plan_id'),
        Index('user_subscriptions_user_id_idx', 'user_id'),
        Index('user_subscriptions_user_id_status_idx', 'user_id', 'status'),
    )

    id = Column(
        BigInteger,
        primary_key=True,
        nullable=False,
        server_default=text("nextval('user_subscriptions_id_seq'::regclass)")
    )
    updated_at = Column(
        TIMESTAMP(precision=7),
        nullable=True
    )
    created_at = Column(
        TIMESTAMP(precision=7),
        nullable=True
    )
    plan_start = Column(
        TIMESTAMP(precision=7),
        nullable=True
    )
    plan_end = Column(
        TIMESTAMP(precision=7),
        nullable=True
    )
    user_id = Column(
        BigInteger,
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=True
    )
    status = Column(
        VARCHAR(32),
        nullable=True
    )
    plan_id = Column(
        BigInteger,
        ForeignKey('subscription_plans.id', onupdate='SET NULL'),
        nullable=True
    )
    is_trial = Column(
        Boolean,
        nullable=True,
        server_default=text('false')
    )
    domains_limit = Column(
        Integer,
        nullable=True
    )
    integrations_limit = Column(
        Integer,
        nullable=True
    )
    platform_subscription_id = Column(
        VARCHAR,
        nullable=True
    )
    members_limit = Column(
        BigInteger,
        nullable=True
    )
    downgrade_at = Column(
        TIMESTAMP(precision=7),
        nullable=True
    )
    downgrade_price_id = Column(
        VARCHAR,
        nullable=True
    )
    cancellation_reason = Column(
        TEXT,
        nullable=True
    )
    price_id = Column(
        VARCHAR,
        nullable=True
    )
    cancel_scheduled_at = Column(
        TIMESTAMP(precision=7),
        nullable=True
    )
    is_avin_sended = Column(
        Boolean,
        nullable=False,
        server_default=text('false')
    )
    contact_credit_plan_id = Column(
        BigInteger,
        ForeignKey('subscription_plans.id', ondelete='SET NULL'),
        nullable=True
    )


Subscription = UserSubscriptions

event.listen(Subscription, "before_insert", create_timestamps)
event.listen(Subscription, "before_update", update_timestamps)
