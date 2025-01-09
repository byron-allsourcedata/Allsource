from sqlalchemy import Column, event, Integer, DECIMAL, Index
from sqlalchemy.dialects.postgresql import BOOLEAN, INTEGER, NUMERIC, VARCHAR, JSONB

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
    is_active = Column(BOOLEAN, default=False, nullable=True)
    is_free_trial = Column(BOOLEAN, default=False, nullable=True)
    domains_limit = Column(Integer, nullable=True)
    integrations_limit = Column(Integer, nullable=True)
    leads_credits = Column(INTEGER, nullable=True)
    prospect_credits = Column(INTEGER, nullable=True)
    members_limit = Column(Integer, nullable=True)
    features = Column(JSONB, nullable=True)
    lead_credit_price = Column(DECIMAL(10, 2), nullable=False)
    priority = Column(INTEGER, nullable=False)
    full_price = Column(NUMERIC(18, 2), nullable=True)
    alias = Column(VARCHAR(64), nullable=True)
    
    __table_args__ = (
        Index('subscription_plans_title_interval_idx', 'title', 'interval'),
        Index('subscription_plans_title_price_idx', 'title', 'price'),
        Index('subscription_plans_alias_idx', 'alias'),
        Index('subscription_plans_interval_is_active_idx', 'interval', 'is_active'),
    )


event.listen(SubscriptionPlan, "before_insert", create_timestamps)
event.listen(SubscriptionPlan, "before_update", update_timestamps)
