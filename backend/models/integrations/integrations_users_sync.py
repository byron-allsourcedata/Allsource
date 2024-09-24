from sqlalchemy import Column, Integer, VARCHAR, TIMESTAMP, Boolean, ARRAY, JSON
from datetime import datetime
from models.base import Base

class IntegrationUserSync(Base):

    __tablename__ = 'integrations_users_sync'
    id = Column(Integer, primary_key=True, autoincrement=True)
    domain_id = Column(Integer)
    integration_id = Column(Integer)
    leads_type = Column(ARRAY(VARCHAR))
    supression = Column(Boolean)
    is_active = Column(Boolean)
    created_at = Column(TIMESTAMP, default=datetime.now)
    last_sync_date = Column(TIMESTAMP)
    list_id = Column(VARCHAR)
    list_name = Column(VARCHAR)
    data_map = Column(JSON)

