from sqlalchemy import Column, event, Integer, BOOLEAN
from sqlalchemy.dialects.postgresql import BIGINT, TIMESTAMP, VARCHAR

from .base import Base, create_timestamps, update_timestamps


class UserSubscriptions(Base):
    __tablename__ = "user_subscriptions"

    id = Column(Integer, primary_key=True, nullable=False)
    updated_at = Column(TIMESTAMP(precision=7), nullable=True)
    created_at = Column(TIMESTAMP(precision=7), nullable=True)
    plan_start = Column(TIMESTAMP(precision=7), nullable=True)
    plan_end = Column(TIMESTAMP(precision=7), nullable=True)
    user_id = Column(BIGINT, nullable=True)
    transaction_id = Column(VARCHAR(64), nullable=True)
    status = Column(VARCHAR(32), default="inactive", nullable=True)
    payment_platform_product_id = Column(VARCHAR, nullable=True)
    plan_id = Column(BIGINT, nullable=True)
    stripe_request_created_at = Column(TIMESTAMP, nullable=True)
    is_trial = Column(BOOLEAN, nullable=True)


Subscription = UserSubscriptions

event.listen(Subscription, "before_insert", create_timestamps)
event.listen(Subscription, "before_update", update_timestamps)
