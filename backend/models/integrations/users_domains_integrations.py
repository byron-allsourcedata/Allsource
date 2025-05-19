from sqlalchemy.dialects.postgresql import JSONB

from models.base import Base
from models.users import Users
from models.users_domains import UserDomains
from sqlalchemy import VARCHAR, Integer, Column, JSON, Boolean, TIMESTAMP, Index, func, ForeignKey, text, String, Text, \
    BigInteger


class UserIntegration(Base):
    __tablename__ = 'users_domains_integrations'
    id = Column(
        BigInteger,
        primary_key=True,
        nullable=False,
        server_default=text("nextval('users_integrations_id_seq'::regclass)")
    )
    access_token = Column(VARCHAR, nullable=True)
    shop_domain = Column(VARCHAR(64), nullable=True)
    service_name = Column(VARCHAR(32), nullable=True)
    data_center = Column(VARCHAR, nullable=True)
    consumer_key = Column(VARCHAR, nullable=True)
    consumer_secret = Column(VARCHAR, nullable=True)
    domain_id = Column(BigInteger, ForeignKey('users_domains.id', ondelete='CASCADE'), nullable=True)
    is_with_suppression = Column(Boolean, nullable=True)
    last_suppression_date = Column(TIMESTAMP, nullable=True)
    ad_account_id = Column(VARCHAR(32), nullable=True)
    full_name = Column(VARCHAR(64), nullable=True)
    last_access_token_update = Column(TIMESTAMP, nullable=True)
    expire_access_token = Column(Integer, nullable=True)
    platform_user_id = Column(VARCHAR(32), nullable=True)
    error_message = Column(VARCHAR(128), nullable=True)
    instance_url = Column(VARCHAR(64), nullable=True)
    is_failed = Column(Boolean, nullable=False, server_default=text('false'))
    shop_id = Column(VARCHAR(32), nullable=True)
    slack_team_id = Column(VARCHAR(32), nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    user_id = Column(BigInteger, ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    is_slack_first_message_sent = Column(Boolean, nullable=False, server_default=text('false'))
    limit = Column(BigInteger, nullable=False, server_default=text('100'))
    
    __table_args__ = (
        Index('users_domains_integrations_suppression_idx', is_with_suppression, domain_id),
        Index('users_domains_integrations_slack_team_id_idx', slack_team_id),
        Index("users_domains_integrations_user", user_id)
    )


class Integration(Base):
    __tablename__ = 'integrations'
    __table_args__ = (
        Index('integrations_service_name_key', 'service_name', unique=True),
    )

    id = Column(
        Integer,
        primary_key=True,
        nullable=False,
        server_default=text("nextval('integrations_id_seq'::regclass)")
    )
    service_name = Column(
        String(255),
        nullable=False
    )
    image_url = Column(
        Text,
        nullable=True
    )
    fields = Column(
        JSONB,
        nullable=True
    )
    type = Column(
        String,
        nullable=True,
        server_default=text("'Marketing'::character varying")
    )
    data_sync = Column(
        Boolean,
        nullable=True,
        server_default=text('true')
    )
