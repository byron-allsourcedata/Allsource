from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey, UUID, Boolean, text, Index, Text
from models.audience_smarts import AudienceSmart
from models.enrichment_users import EnrichmentUser
from .base import Base
from sqlalchemy.sql import func


class AudienceSmartPerson(Base):
    __tablename__ = 'audience_smarts_persons'
    
    __table_args__ = (
      Index('audience_smarts_persons_is_validation_processed_idx', 'is_validation_processed'),
      Index('audience_smarts_persons_smart_audience_id_idx', 'smart_audience_id'),
      Index('audience_smarts_persons_enrichment_user_id_idx', 'enrichment_user_id'),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        unique=True,
        nullable=False,
        server_default=text('uuid_generate_v1()')
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
        server_default=text('false')
    )
    is_validation_processed = Column(
        Boolean,
        nullable=True,
        server_default=text('true')
    )
    valid_phone = Column(
        Text,
        nullable=True,
    )
    created_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=func.now()
    )
    updated_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )
    
