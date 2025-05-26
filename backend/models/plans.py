from sqlalchemy import Column, Integer, ForeignKey, Index, BigInteger, text, Text, Numeric, Boolean, Sequence
from sqlalchemy.dialects.postgresql import VARCHAR, JSONB

from .base import Base


class SubscriptionPlan(Base):
    __tablename__ = 'subscription_plans'
    __table_args__ = (
        Index('subscription_plans_alias_idx', 'alias', unique=True),
        Index('subscription_plans_contact_credit_plan_id_idx', 'contact_credit_plan_id'),
        Index('subscription_plans_interval_is_active_idx', 'interval', 'is_active'),
        Index('subscription_plans_platform_is_active_idx', 'platform', 'is_active'),
        Index('subscription_plans_title_interval_idx', 'title', 'interval'),
        Index('subscription_plans_title_price_idx', 'title', 'price'),
    )

    id = Column(
        BigInteger,
        Sequence('subscription_plans_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    title = Column(VARCHAR(64), nullable=True)
    description = Column(Text, nullable=True)
    interval = Column(VARCHAR(16), nullable=True)
    stripe_price_id = Column(VARCHAR(128), nullable=True)
    price = Column(Numeric, nullable=True)
    currency = Column(VARCHAR(8), nullable=True)
    trial_days = Column(Integer, nullable=True)
    is_default = Column(Boolean, nullable=True)
    coupon_id = Column(VARCHAR, nullable=True)
    is_active = Column(Boolean, nullable=True)
    is_free_trial = Column(
        Boolean,
        nullable=False,
        server_default=text('false')
    )
    domains_limit = Column(Integer, nullable=True)
    integrations_limit = Column(Integer, nullable=True)
    leads_credits = Column(BigInteger, nullable=True)
    prospect_credits = Column(BigInteger, nullable=True)
    members_limit = Column(Integer, nullable=True)
    features = Column(JSONB, nullable=True)
    priority = Column(Integer, nullable=True)
    full_price = Column(Numeric(18, 2), nullable=True)
    alias = Column(VARCHAR(64), nullable=False)
    platform = Column(VARCHAR(64), nullable=True)
    contact_credit_plan_id = Column(
        BigInteger,
        ForeignKey('subscription_plans.id', ondelete='SET NULL'),
        nullable=True
    )


