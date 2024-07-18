from sqlalchemy import Column, ForeignKey, event, Integer
from sqlalchemy.dialects.postgresql import BIGINT, BOOLEAN, INTEGER, NUMERIC, TIMESTAMP, VARCHAR
from sqlalchemy.orm import relationship

from .base import Base, create_timestamps, update_timestamps


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True)
    title = Column(VARCHAR(32))
    description = Column(VARCHAR(128))
    interval = Column(VARCHAR(16))
    stripe_price_id = Column(VARCHAR(64))
    price = Column(NUMERIC(18, 2))
    currency = Column(VARCHAR(8), default="usd")
    trial_days = Column(INTEGER, default=7)
    is_default = Column(BOOLEAN, default=False)
    coupon_id = Column(VARCHAR)
    created_at = Column(TIMESTAMP(precision=6))
    updated_at = Column(TIMESTAMP(precision=6))
    is_active = Column(BOOLEAN, default=False)
    is_free_trail = Column(BOOLEAN, default=False)


class UserSubscriptionPlan(Base):
    __tablename__ = "user_subscription_plan"

    id = Column(BIGINT, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=False)
    subscription_id = Column(BIGINT, ForeignKey("user_subscriptions.id"))
    created_at = Column(TIMESTAMP(precision=6))
    updated_at = Column(TIMESTAMP(precision=6))
    is_trial = Column(BOOLEAN, default=False)
    user = relationship("Users")
    plan = relationship("SubscriptionPlan")


event.listen(SubscriptionPlan, "before_insert", create_timestamps)
event.listen(SubscriptionPlan, "before_update", update_timestamps)
event.listen(UserSubscriptionPlan, "before_insert", create_timestamps)
event.listen(UserSubscriptionPlan, "before_update", update_timestamps)
