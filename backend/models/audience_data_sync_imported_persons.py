import uuid

from sqlalchemy import Column, Integer, VARCHAR, Index, UUID, ForeignKey, text, String, BigInteger
from sqlalchemy.dialects.postgresql import TIMESTAMP
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.enrichment.enrichment_users import EnrichmentUser
from .base import Base


class AudienceDataSyncImportedPersons(Base):
    __tablename__ = 'audience_data_sync_imported_persons'
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        default=uuid.uuid1,
    )
    status = Column(String(64), nullable=False)
    service_name = Column(String(128), nullable=False)
    data_sync_id = Column(
        BigInteger,
        ForeignKey('integrations_users_sync.id', ondelete='CASCADE'),
        nullable=True
    )
    created_at = Column(
        TIMESTAMP,
        server_default=text('CURRENT_TIMESTAMP'),
        nullable=True
    )
    updated_at = Column(TIMESTAMP, nullable=True)
    enrichment_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey(EnrichmentUser.id, ondelete='CASCADE'),
        nullable=False
    )
    
    __table_args__ = (
        Index(
            'audience_data_sync_imported_persons_enrichment_user_id_data_syn', enrichment_user_id, data_sync_id, unique=True
        ),
        Index(
            'audience_data_sync_imported_persons_data_sync', data_sync_id, unique=False
        ),
    )
