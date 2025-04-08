from sqlalchemy import Column, Integer, VARCHAR, Index, UUID, ForeignKey
from sqlalchemy.dialects.postgresql import TIMESTAMP
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.enrichment_users import EnrichmentUser
from .base import Base

class AudienceDataSyncImportedPersons(Base):
    __tablename__ = 'audience_data_sync_imported_persons'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    status = Column(VARCHAR(64), nullable=False)
    service_name = Column(VARCHAR(128), nullable=False)
    data_sync_id = Column(Integer, ForeignKey(IntegrationUserSync.id), nullable=True)
    created_at = Column(TIMESTAMP(precision=7), nullable=True)
    updated_at = Column(TIMESTAMP(precision=7), nullable=True)
    enrichment_user_id = Column(UUID, ForeignKey(EnrichmentUser.id, ondelete='cascade'), nullable=False)
    
    __table_args__ = (
        Index('data_sync_imported_leads_data_sync_id_status_idx', 'data_sync_id','status'),
    )