from sqlalchemy import Column, DateTime, event, Integer
from sqlalchemy.dialects.postgresql import BIGINT, BOOLEAN, INTEGER, TIMESTAMP, VARCHAR, ARRAY, FLOAT

from .base import Base, create_timestamps, update_timestamps


class Users(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, nullable=False)
    email = Column(VARCHAR, nullable=True)
    is_email_confirmed = Column(BOOLEAN, default=False, nullable=True)
    is_with_card = Column(BOOLEAN, default=False, nullable=True)
    is_company_details_filled = Column(BOOLEAN, default=False, nullable=True)
    is_partner = Column(BOOLEAN, default=False, nullable=True)
    password = Column(VARCHAR, nullable=True)
    full_name = Column(VARCHAR, nullable=True)
    team_owner_id = Column(BIGINT, nullable=True)
    image = Column(VARCHAR, nullable=True)
    company_name = Column(VARCHAR, nullable=True)
    company_website = Column(VARCHAR, nullable=True)
    company_email_address = Column(VARCHAR, nullable=True)
    company_role = Column(VARCHAR(16), nullable=True)
    company_website_visits = Column(VARCHAR(16), nullable=True)
    employees_workers = Column(VARCHAR(16), nullable=True)
    created_at = Column(TIMESTAMP(precision=7), nullable=True)
    last_login = Column(TIMESTAMP(precision=7), nullable=True)
    payment_status = Column(VARCHAR, default='pending', nullable=True)
    customer_id = Column(VARCHAR, nullable=True)
    reset_password_sent_at = Column(DateTime, nullable=True)
    pixel_code_sent_at = Column(DateTime, nullable=True)
    verified_email_sent_at = Column(DateTime, nullable=True)
    change_email_sent_at = Column(DateTime, nullable=True)
    is_book_call_passed = Column(BOOLEAN, default=False, nullable=True)
    stripe_payment_url = Column(VARCHAR(1024), nullable=True)
    data_provider_id = Column(VARCHAR(64), nullable=True)
    is_pixel_installed = Column(BOOLEAN, default=False, nullable=True)
    role = Column(ARRAY(VARCHAR(32)))
    calendly_uuid = Column(VARCHAR(64), nullable=True)
    calendly_invitee_uuid = Column(VARCHAR(64), nullable=True)
    activate_steps_percent = Column(INTEGER, nullable=True)
    leads_credits = Column(INTEGER, nullable=True, default=0)
    prospect_credits = Column(INTEGER, nullable=True, default=0)
    is_leads_auto_charging = Column(BOOLEAN, default=True, nullable=False)
    last_signed_in = Column(TIMESTAMP(precision=7), nullable=True)
    team_access_level = Column(VARCHAR(32), nullable=True, default='owner')
    invited_by_id = Column(VARCHAR(32), nullable=True)
    added_on = Column(TIMESTAMP(precision=7), nullable=True)
    current_subscription_id = Column(Integer, nullable=False)
    awin_awc = Column(VARCHAR(128), nullable=True)
    source_platform = Column(VARCHAR(64), nullable=True)
    charge_id = Column(VARCHAR(64), nullable=True)
    shop_id = Column(VARCHAR(64), nullable=True)
    shopify_token = Column(VARCHAR(64), nullable=True)
    shop_domain = Column(VARCHAR(64), nullable=True)
    connected_stripe_account_id = Column(VARCHAR(128), nullable=True)


User = Users

event.listen(User, "before_insert", create_timestamps)
event.listen(User, "before_update", update_timestamps)
