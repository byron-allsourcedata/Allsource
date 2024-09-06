from sqlalchemy import Column, Integer, VARCHAR, TIMESTAMP, Boolean
from datetime import datetime
from models.base import Base

class IntegrationUserSync(Base):

    __talename__ = 'integrations_users_sync'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer)
    integration_id = Column(Integer)
    sync_type = Column(VARCHAR(32))
    supression = Column(Boolean)
    is_active = Column(Boolean)
    created_at = Column(TIMESTAMP, default=datetime.now)
    filter_by_contact_type = Column(VARCHAR)
    last_sync_date = Column(TIMESTAMP)
    list_id = Column(VARCHAR)
    list_name = Column(VARCHAR)

