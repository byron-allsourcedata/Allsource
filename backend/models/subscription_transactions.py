from sqlalchemy import Column, ForeignKey, event, Integer, VARCHAR, DECIMAL
from sqlalchemy.dialects.postgresql import BIGINT, TIMESTAMP

from .base import Base, create_timestamps, update_timestamps


class SubscriptionTransactions(Base):
    __tablename__ = "subscription_transactions"

    id = Column(BIGINT, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=False)
    created_at = Column(TIMESTAMP(precision=6))
    platform_subscription_id = Column(VARCHAR, nullable=True)
    stripe_request_created_at = Column(TIMESTAMP, nullable=True)
    transaction_id = Column(VARCHAR, nullable=True)
    status = Column(VARCHAR, nullable=True)
    plan_name = Column(VARCHAR, nullable=True)
    start_date = Column(TIMESTAMP, nullable=True)
    end_date = Column(TIMESTAMP, nullable=True)
    currency = Column(VARCHAR, nullable=True)
    price_id = Column(VARCHAR, nullable=True)
    amount = Column(DECIMAL(10, 2), nullable=False)


event.listen(SubscriptionTransactions, "before_insert", create_timestamps)
event.listen(SubscriptionTransactions, "before_update", update_timestamps)