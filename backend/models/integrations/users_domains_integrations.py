from models.base import Base
from sqlalchemy import VARCHAR, Integer, Column, JSON, Boolean, TIMESTAMP

class UserIntegration(Base):
    __tablename__ = 'users_domains_integrations'
    id = Column(Integer, primary_key=True)
    domain_id = Column(Integer)
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
    error_message = Column(VARCHAR(64))
    is_failed = Column(Boolean, default=False)
    shop_id = Column(VARCHAR(32))
    slack_team_id = Column(VARCHAR(32))

class Integration(Base):

    __tablename__ = 'integrations'
    id = Column(Integer, primary_key=True)
    service_name = Column(VARCHAR)
    image_url = Column(VARCHAR)
    fields = Column(JSON)
    type = Column(VARCHAR)
    data_sync = Column(Boolean)