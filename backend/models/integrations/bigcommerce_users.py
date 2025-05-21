from sqlalchemy import Column, BigInteger, String, Boolean, Integer, Text, TIMESTAMP, text, Sequence
from models.base import Base
from datetime import datetime


class BigCommerceUser(Base):
    __tablename__ = 'integration_bigcommerce_users'

    id = Column(
        BigInteger,
        Sequence('bigcommerce_users_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    authentication_force_password_reset = Column(
        Boolean,
        nullable=True,
        server_default=text('false')
    )
    company = Column(
        Text,
        nullable=True
    )
    customer_group_id = Column(
        Integer,
        nullable=True,
        server_default=text('0')
    )
    email = Column(
        Text,
        nullable=False
    )
    first_name = Column(
        Text,
        nullable=True
    )
    last_name = Column(
        Text,
        nullable=True
    )
    notes = Column(
        Text,
        nullable=True
    )
    phone = Column(
        Text,
        nullable=True
    )
    registration_ip_address = Column(
        Text,
        nullable=True
    )
    tax_exempt_category = Column(
        Text,
        nullable=True
    )
    date_created = Column(
        TIMESTAMP,
        nullable=False
    )
    date_modified = Column(
        TIMESTAMP,
        nullable=False
    )
    accepts_product_review_abandoned_cart_emails = Column(
        Boolean,
        nullable=True,
        server_default=text('false')
    )
    origin_channel_id = Column(
        Integer,
        nullable=True
    )
    channel_ids = Column(
        Text,
        nullable=True
    )
