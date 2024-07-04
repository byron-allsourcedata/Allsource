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
    company = Column(VARCHAR)
    created_at = Column(TIMESTAMP(precision=7))
    last_login = Column(TIMESTAMP(precision=7))
    payment_status = Column(INTEGER, default=5)
    customer_id = Column(VARCHAR)
    website = Column(VARCHAR)
    reset_password_expiration_time = Column(DateTime)



User = Users

event.listen(User, "before_insert", create_timestamps)
event.listen(User, "before_update", update_timestamps)