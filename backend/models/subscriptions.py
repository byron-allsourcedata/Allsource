from sqlalchemy import Column, event, Integer, BOOLEAN, TEXT
from sqlalchemy.dialects.postgresql import BIGINT, TIMESTAMP, VARCHAR

from .base import Base, create_timestamps, update_timestamps


class UserSubscriptions(Base):
    __tablename__ = "user_subscriptions"

    id = Column(Integer, primary_key=True, nullable=False)
    updated_at = Column(TIMESTAMP(precision=7), nullable=True)
    created_at = Column(TIMESTAMP(precision=7), nullable=True)
    plan_start = Column(TIMESTAMP(precision=7), nullable=True)
    plan_end = Column(TIMESTAMP(precision=7), nullable=True)
    user_id = Column(Integer, unique=True, nullable=False)
    status = Column(VARCHAR(32), default="inactive", nullable=True)
    platform_subscription_id = Column(VARCHAR, nullable=True)
    plan_id = Column(BIGINT, nullable=True)
    is_trial = Column(BOOLEAN, nullable=True, default=False)
    domains_limit = Column(Integer, nullable=True)
    overage = Column(VARCHAR, nullable=False)
    members_limit = Column(Integer, nullable=True)
    integrations_limit = Column(Integer, nullable=True)
    downgrade_at = Column(TIMESTAMP(precision=7), nullable=True)
    downgrade_price_id = Column(VARCHAR, nullable=True)
    cancellation_reason = Column(TEXT, nullable=True)
    price_id = Column(VARCHAR, nullable=True)
    cancel_scheduled_at = Column(TIMESTAMP(precision=7), nullable=True)


Subscription = UserSubscriptions

event.listen(Subscription, "before_insert", create_timestamps)
event.listen(Subscription, "before_update", update_timestamps)
