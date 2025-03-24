from sqlalchemy import Column, Integer, VARCHAR, TIMESTAMP, Boolean, JSON, UUID, ForeignKey, Index
from sqlalchemy.dialects.postgresql import ENUM
from datetime import datetime
from models.audience_smarts import AudienceSmart
from models.base import Base

data_sync_type = ENUM('pixel', 'audience', name='data_sync_type', create_type=True)

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
    last_sent_lead_id = Column(Integer, nullable=True)
    method = Column(VARCHAR(8))
    result_file_url = Column(VARCHAR(256), nullable=True)
    sync_type = Column(data_sync_type, nullable=False, default='pixel')
    smart_audience_id = Column(UUID, ForeignKey(AudienceSmart.id, ondelete='cascade'), nullable=True)
    sent_contacts = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        Index('integrations_users_sync_domain_id_idx', 'domain_id'),
        Index('integrations_users_sync_leads_type_idx', 'sync_type'),
        Index('integrations_users_sync_smart_audience_id_idx', 'smart_audience_id'),
    )