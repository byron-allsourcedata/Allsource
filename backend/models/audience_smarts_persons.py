import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, TIMESTAMP, ForeignKey, UUID, Boolean, text, Index, event

from models.audience_smarts import AudienceSmart
from models.enrichment.enrichment_users import EnrichmentUser
from .base import Base, update_timestamps


class AudienceSmartPerson(Base):
    __tablename__ = 'audience_smarts_persons'
    
    __table_args__ = (
      Index('au_sm_ps_is_validation_processed_smart_audience_id_idx', 'is_validation_processed', 'smart_audience_id'),
      Index('au_sm_ps_is_valid_smart_audience_id_idx', 'is_valid', 'smart_audience_id'),
      Index('audience_smarts_persons_smart_audience_id_idx', 'smart_audience_id'),
      Index('audience_smarts_persons_enrichment_user_id_idx', 'enrichment_user_id'),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        unique=True,
        nullable=False,
        default=uuid.uuid1
    )
    smart_audience_id = Column(
        UUID(as_uuid=True),
        ForeignKey(AudienceSmart.id, ondelete='CASCADE'),
        nullable=False
    )
    enrichment_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey(EnrichmentUser.id),
        nullable=True
    )
    is_valid = Column(
        Boolean,
        nullable=False,
        server_default=text('true')
    )
    is_validation_processed = Column(
        Boolean,
        nullable=True,
        server_default=text('true')
    )
    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

event.listen(AudienceSmartPerson, "before_update", update_timestamps)
    
