from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, Boolean, text, ForeignKey, BigInteger, Index, Sequence
from sqlalchemy.dialects.postgresql import TIMESTAMP, VARCHAR, ARRAY, JSON

from .base import Base


class Users(Base):
    __tablename__ = 'users'
    __table_args__ = (
        Index('users_email_idx', 'email', unique=True),
        Index('users_data_provider_id_idx', 'data_provider_id', unique=True),
    )

    id = Column(
        BigInteger,
        Sequence('users_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    email = Column(VARCHAR, nullable=True)
    is_email_confirmed = Column(Boolean, nullable=True, server_default=text('false'))
    password = Column(VARCHAR, nullable=True)
    full_name = Column(VARCHAR, nullable=True)
    business_type = Column(VARCHAR, nullable=False, server_default=text("'d2c'::character varying"))
    team_owner_id = Column(BigInteger, ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    image = Column(VARCHAR, nullable=True)
    company_name = Column(VARCHAR, nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    last_login = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    payment_status = Column(VARCHAR, nullable=True, server_default=text("'PENDING'::character varying"))
    customer_id = Column(VARCHAR, nullable=True)
    company_website = Column(VARCHAR, nullable=True)
    reset_password_sent_at = Column(DateTime, nullable=True)
    is_with_card = Column(Boolean, nullable=True, server_default=text('false'))
    is_company_details_filled = Column(Boolean, nullable=True, server_default=text('false'))
    verified_email_sent_at = Column(TIMESTAMP(precision=7), nullable=True)
    company_email_address = Column(VARCHAR, nullable=True)
    employees_workers = Column(VARCHAR(256), nullable=True)
    is_book_call_passed = Column(Boolean, nullable=False, server_default=text('false'))
    stripe_payment_url = Column(JSON, nullable=True)
    data_provider_id = Column(VARCHAR(64), nullable=True)
    role = Column(ARRAY(VARCHAR(32)), nullable=True, server_default=text("ARRAY['customer']"))
    company_role = Column(VARCHAR(16), nullable=True)
    company_website_visits = Column(VARCHAR(16), nullable=True)
    pixel_code_sent_at = Column(TIMESTAMP(precision=7), nullable=True)
    calendly_uuid = Column(VARCHAR(64), nullable=True)
    calendly_invitee_uuid = Column(VARCHAR(64), nullable=True)
    activate_steps_percent = Column(Integer, nullable=True, server_default=text('0'))
    leads_credits = Column(Integer, nullable=False, server_default=text('0'))
    prospect_credits = Column(Integer, nullable=False, server_default=text('0'))
    change_email_sent_at = Column(TIMESTAMP(precision=7), nullable=True)
    is_leads_auto_charging = Column(Boolean, nullable=False, server_default=text('false'))
    last_signed_in = Column(TIMESTAMP(precision=7), nullable=True)
    team_access_level = Column(VARCHAR(32), nullable=True)
    added_on = Column(TIMESTAMP(precision=7), nullable=True)
    invited_by_id = Column(BigInteger, ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    current_subscription_id = Column(BigInteger, ForeignKey('user_subscriptions.id', ondelete='SET NULL'),
                                     nullable=True)
    awin_awc = Column(VARCHAR(128), nullable=True)
    source_platform = Column(VARCHAR(64), nullable=True)
    connected_stripe_account_id = Column(VARCHAR, nullable=True)
    shop_id = Column(VARCHAR(64), nullable=True)
    shopify_token = Column(VARCHAR(64), nullable=True)
    shop_domain = Column(VARCHAR(64), nullable=True)
    is_partner = Column(Boolean, nullable=True, server_default=text('false'))
    charge_id = Column(VARCHAR(64), nullable=True)
    utm_params = Column(JSON, nullable=True)
    is_stripe_connected = Column(Boolean, nullable=False, server_default=text('false'))
    stripe_connected_email = Column(VARCHAR, nullable=True)
    stripe_connected_currently_due = Column(JSON, nullable=True)


User = Users
