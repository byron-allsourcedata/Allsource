from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey, UUID, BOOLEAN, Index 
from models.audience_smarts import AudienceSmart
from models.enrichment_users import EnrichmentUser
from .base import Base
from sqlalchemy.sql import func


class AudienceSmartPerson(Base):
    __tablename__ = 'audience_smarts_persons'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    smart_audience_id = Column(UUID(as_uuid=True), ForeignKey(AudienceSmart.id, ondelete='cascade'), nullable=False)
    enrichment_user_id = Column(UUID(as_uuid=True), ForeignKey(EnrichmentUser.id), nullable=True)
    is_valid = Column(BOOLEAN, default=False, nullable=False)
    is_validation_processed = Column(BOOLEAN, default=False, nullable=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index('audience_smarts_persons_is_validation_processed_idx', 'is_validation_processed'),
        Index('audience_smarts_persons_smart_audience_id_idx', 'smart_audience_id'),
        Index('audience_smarts_persons_enrichment_user_id_idx', 'enrichment_user_id'),
    )
