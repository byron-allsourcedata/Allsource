import uuid
from sqlalchemy import Column, event, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import mapped_column, Mapped

from .base import Base, create_timestamps, update_timestamps
from .audience_lookalikes import AudienceLookalikes
from .enrichment_users import EnrichmentUser


class EnrichmentLookalikeScore(Base):
    __tablename__ = 'enrichment_lookalike_scores'

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lookalike_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(AudienceLookalikes.id, ondelete='cascade'))
    enrichment_user_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(EnrichmentUser.id, ondelete='cascade'))
    score: Mapped[float] = mapped_column(Float)

event.listen(EnrichmentLookalikeScore, "before_insert", create_timestamps)
event.listen(EnrichmentLookalikeScore, "before_update", update_timestamps)
