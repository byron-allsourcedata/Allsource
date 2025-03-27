from sqlalchemy import Column, Integer, VARCHAR, TIMESTAMP, Boolean, JSON
from datetime import datetime
from models.base import Base

class IntegrationUserSync(Base):

    __tablename__ = 'integrations_users_sync'
    id = Column(Integer, primary_key=True, autoincrement=True)
    domain_id = Column(Integer, nullable=False)
    integration_id = Column(Integer, nullable=False)
    leads_type = Column(VARCHAR, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, default=datetime.now)
    last_sync_date = Column(TIMESTAMP)
    list_id = Column(VARCHAR)
    customer_id = Column(VARCHAR)
    list_name = Column(VARCHAR)
    data_map = Column(JSON)
    sync_status = Column(Boolean, default=True)
    no_of_contacts = Column(Integer, nullable=False, default=0)
    created_by = Column(VARCHAR, nullable=False)
    last_lead_sync_id = Column(VARCHAR(64))
    hook_url = Column(VARCHAR)
    campaign_id = Column(VARCHAR, nullable=True)
    campaign_name = Column(VARCHAR, nullable=True)
    last_sent_lead_id = Column(Integer, nullable=True)
    method = Column(VARCHAR(8))
