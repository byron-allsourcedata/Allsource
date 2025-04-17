import uuid
from sqlalchemy import Column, TIMESTAMP, event, ForeignKey, DECIMAL, Index
from sqlalchemy.dialects.postgresql import UUID
from models.enrichment_users import EnrichmentUser
from models.audience_lookalikes import AudienceLookalikes
from .base import Base, create_timestamps, update_timestamps

class EnrichmentLookalikeScore(Base):
    __tablename__ = 'enrichment_lookalike_scores'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, default=uuid.uuid4)
    lookalike_id = Column(UUID(as_uuid=True), ForeignKey(AudienceLookalikes.id, ondelete='cascade'), nullable=False)
    enrichment_user_id = Column(UUID(as_uuid=True),ForeignKey(EnrichmentUser.id, ondelete='cascade'), nullable=False)
    score = Column(DECIMAL(10, 2), default=0)
    created_at = Column(TIMESTAMP, nullable=False)
    updated_at = Column(TIMESTAMP, nullable=False)

    __table_args__ = (
        Index("audiencelookalikes_user_created_date", "id"),
    )

event.listen(EnrichmentLookalikeScore, "before_insert", create_timestamps)
event.listen(EnrichmentLookalikeScore, "before_update", update_timestamps)
