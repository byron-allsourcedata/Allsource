from sqlalchemy import Column, BigInteger, String, Boolean, Integer, Text, TIMESTAMP
from models.base import Base
from datetime import datetime


class BigCommerceUser(Base):
    __tablename__ = 'integration_bigcommerce_users'
    id = Column(BigInteger, primary_key=True)
    authentication_force_password_reset = Column(Boolean, default=False)
    company = Column(Text)
    customer_group_id = Column(Integer, default=0)
    email = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    notes = Column(Text)
    phone = Column(String)
    registration_ip_address = Column(String)
    tax_exempt_category = Column(String)
    date_created = Column(TIMESTAMP, nullable=False, default=datetime.now)
    date_modified = Column(TIMESTAMP, nullable=False)
    accepts_product_review_abandoned_cart_emails = Column(Boolean, default=False)
    origin_channel_id = Column(Integer)
    channel_ids = Column(Text)
