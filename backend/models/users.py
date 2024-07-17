from sqlalchemy import Column, DateTime, event, Integer
from sqlalchemy.dialects.postgresql import BIGINT, BOOLEAN, INTEGER, TIMESTAMP, VARCHAR

from .base import Base, create_timestamps, update_timestamps


class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(VARCHAR)
    is_email_confirmed = Column(BOOLEAN, default=False)
    is_with_card = Column(BOOLEAN, default=False)
    is_company_details_filled = Column(BOOLEAN, default=False)
    password = Column(VARCHAR)
    full_name = Column(VARCHAR)
    parent_id = Column(BIGINT)
    image = Column(VARCHAR)
    company_name = Column(VARCHAR)
    company_website = Column(VARCHAR)
    company_email_address = Column(VARCHAR)
    employees_workers = Column(VARCHAR)
    created_at = Column(TIMESTAMP(precision=7))
    last_login = Column(TIMESTAMP(precision=7))
    payment_status = Column(INTEGER, default=5)
    customer_id = Column(VARCHAR)
    reset_password_sent_at = Column(DateTime)
    verified_email_sent_at = Column(DateTime)
    is_book_call_passed = Column(BOOLEAN, default=False)
    stripe_payment_url = Column(VARCHAR)
    data_provider_id = Column(VARCHAR(32))
    is_pixel_installed = Column(BOOLEAN, default=False)


User = Users

event.listen(User, "before_insert", create_timestamps)
event.listen(User, "before_update", update_timestamps)
