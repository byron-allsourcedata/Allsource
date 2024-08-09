from sqlalchemy import Column, ForeignKey, event, Integer
from sqlalchemy.dialects.postgresql import BIGINT, BOOLEAN, INTEGER, NUMERIC, TIMESTAMP, VARCHAR
from sqlalchemy.orm import relationship

from .base import Base, create_timestamps, update_timestamps


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True, nullable=False)
    title = Column(VARCHAR(32), nullable=True)
    description = Column(VARCHAR(128), nullable=True)
    interval = Column(VARCHAR(16), nullable=True)
    stripe_price_id = Column(VARCHAR(64), nullable=True)
    price = Column(NUMERIC(18, 2), nullable=True)
    currency = Column(VARCHAR(8), default="usd", nullable=True)
    trial_days = Column(INTEGER, default=7, nullable=True)
    is_default = Column(BOOLEAN, default=False, nullable=True)
    coupon_id = Column(VARCHAR, nullable=True)
    created_at = Column(TIMESTAMP(precision=6), nullable=True)
    updated_at = Column(TIMESTAMP(precision=6), nullable=True)
    is_active = Column(BOOLEAN, default=False, nullable=True)
    is_free_trial = Column(BOOLEAN, default=False, nullable=True)


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
