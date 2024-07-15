from sqlalchemy import Column, ForeignKey, event, Integer, create_engine
from sqlalchemy.dialects.postgresql import BIGINT, BOOLEAN, INTEGER, NUMERIC, TEXT, TIMESTAMP, VARCHAR
from sqlalchemy.orm import sessionmaker

from .base import Base, create_timestamps, update_timestamps


class UserSubscriptions(Base):
    __tablename__ = "user_subscriptions"

    id = Column(Integer, primary_key=True)
    updated_at = Column(TIMESTAMP(precision=7))
    updated_by = Column(BIGINT)
    created_at = Column(TIMESTAMP(precision=7))
    created_by = Column(BIGINT)
    plan_name = Column(VARCHAR(64))
    plan_start = Column(TIMESTAMP(precision=7))
    plan_end = Column(TIMESTAMP(precision=7))
    currency = Column(VARCHAR(32))
    price = Column(NUMERIC(18, 2))
    price_id = Column(VARCHAR(64))
    user_id = Column(BIGINT)
    transaction_id = Column(VARCHAR(64))
    subscription_id = Column(VARCHAR(32))
    status = Column(VARCHAR(32), default="pending")
    source = Column(VARCHAR(16), default="stripe")
    payment_platform_product_id = Column(VARCHAR)
    payment_platform_plan_id = Column(BIGINT)
    is_cancelled = Column(BOOLEAN, default=False)
    canceled_on = Column(TIMESTAMP(precision=7))
    reason_of_cancel = Column(TEXT)


Subscription = UserSubscriptions


event.listen(Subscription, "before_insert", create_timestamps)
event.listen(Subscription, "before_update", update_timestamps)
