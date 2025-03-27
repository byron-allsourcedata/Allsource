from models.base import Base
from models.users import Users
from models.users_domains import UserDomains
from sqlalchemy import VARCHAR, Integer, Column, JSON, Boolean, TIMESTAMP, Index, func, ForeignKey

class UserIntegration(Base):
    __tablename__ = 'users_domains_integrations'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey(Users.id), nullable=True)
    domain_id = Column(Integer, ForeignKey(UserDomains.id), nullable=True)
    shop_domain = Column(VARCHAR(64))
    access_token = Column(VARCHAR)
    service_name = Column(VARCHAR(32))
    data_center = Column(VARCHAR)
    is_with_suppression = Column(Boolean)
    ad_account_id = Column(VARCHAR(32))
    full_name = Column(VARCHAR(64))
    platform_user_id = Column(VARCHAR(32))
    last_access_token_update = Column(TIMESTAMP)
    expire_access_token = Column(Integer)
    error_message = Column(VARCHAR(128))
    instance_url = Column(VARCHAR(64))
    is_failed = Column(Boolean, default=False)
    shop_id = Column(VARCHAR(32))
    slack_team_id = Column(VARCHAR(32))
    created_at = Column(TIMESTAMP, default=func.now(), nullable=True)
    is_slack_first_message_sent = Column(Boolean, default=False, nullable=False)
    
    __table_args__ = (
        Index('users_domains_integrations_pkey', 'id'),
        Index('users_domains_integrations_suppression_idx', 'is_with_suppression', 'domain_id'),
        Index('users_domains_integrations_slack_team_id_idx', 'slack_team_id'),
    )

class Integration(Base):

    __tablename__ = 'integrations'
    id = Column(Integer, primary_key=True)
    service_name = Column(VARCHAR)
    image_url = Column(VARCHAR)
    fields = Column(JSON)
    type = Column(VARCHAR)
    data_sync = Column(Boolean)