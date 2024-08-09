from sqlalchemy import Column, event, Integer
from sqlalchemy.dialects.postgresql import BIGINT, BOOLEAN, NUMERIC, TEXT, TIMESTAMP, VARCHAR

from .base import Base, create_timestamps, update_timestamps


class UserSubscriptions(Base):
    __tablename__ = "user_subscriptions"

    id = Column(Integer, primary_key=True, nullable=False)
    updated_at = Column(TIMESTAMP(precision=7), nullable=True)
    updated_by = Column(BIGINT, nullable=True)
    created_at = Column(TIMESTAMP(precision=7), nullable=True)
    created_by = Column(BIGINT, nullable=True)
    plan_name = Column(VARCHAR(64), nullable=True)
    plan_start = Column(TIMESTAMP(precision=7), nullable=True)
    plan_end = Column(TIMESTAMP(precision=7), nullable=True)
    currency = Column(VARCHAR(32), nullable=True)
    price = Column(NUMERIC(18, 2), nullable=True)
    price_id = Column(VARCHAR(64), nullable=True)
    user_id = Column(BIGINT, nullable=True)
    transaction_id = Column(VARCHAR(64), nullable=True)
    subscription_id = Column(VARCHAR(32), nullable=True)
    status = Column(VARCHAR(32), default="pending", nullable=True)
    source = Column(VARCHAR(16), default="stripe", nullable=True)
    payment_platform_product_id = Column(VARCHAR, nullable=True)
    payment_platform_plan_id = Column(BIGINT, nullable=True)
    is_cancelled = Column(BOOLEAN, default=False, nullable=True)
    canceled_on = Column(TIMESTAMP(precision=7), nullable=True)
    reason_of_cancel = Column(TEXT, nullable=True)
    stripe_request_created_at = Column(TIMESTAMP(precision=7), nullable=True)


Subscription = UserSubscriptions

event.listen(Subscription, "before_insert", create_timestamps)
event.listen(Subscription, "before_update", update_timestamps)
