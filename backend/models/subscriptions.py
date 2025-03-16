from sqlalchemy import Column, ForeignKey, Integer, BOOLEAN, TEXT, event, Index
from sqlalchemy.dialects.postgresql import BIGINT, TIMESTAMP, VARCHAR
from models.plans import SubscriptionPlan
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
    contact_credit_plan_id = Column(Integer, ForeignKey(SubscriptionPlan.id), nullable=True)
    members_limit = Column(Integer, nullable=True)
    integrations_limit = Column(Integer, nullable=True)
    downgrade_at = Column(TIMESTAMP(precision=7), nullable=True)
    downgrade_price_id = Column(VARCHAR, nullable=True)
    cancellation_reason = Column(TEXT, nullable=True)
    price_id = Column(VARCHAR, nullable=True)
    cancel_scheduled_at = Column(TIMESTAMP(precision=7), nullable=True)
    is_avin_sended = Column(BOOLEAN, default=False, nullable=False)
    
Index('user_subscriptions_user_id_idx', UserSubscriptions.user_id)
Index('user_subscriptions_user_id_status_idx', UserSubscriptions.user_id, UserSubscriptions.status)
Index('user_subscriptions_contact_credit_plan_id_idx', UserSubscriptions.contact_credit_plan_id)

Subscription = UserSubscriptions

event.listen(Subscription, "before_insert", create_timestamps)
event.listen(Subscription, "before_update", update_timestamps)