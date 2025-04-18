from sqlalchemy import event, ForeignKey, Double
from sqlalchemy.dialects.postgresql import UUID
from .base import Base, create_timestamps, update_timestamps
from sqlalchemy import UUID, ForeignKey, Float
from sqlalchemy.orm import mapped_column, Mapped

from .audience_lookalikes import AudienceLookalikes
from .base import Base
from .enrichment_users import EnrichmentUser


class EnrichmentLookalikeScore(Base):
    __tablename__ = 'enrichment_lookalike_scores'

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, unique=True, server_default="gen_random_uuid()")
    lookalike_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(AudienceLookalikes.id, ondelete='cascade'))
    enrichment_user_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(EnrichmentUser.id, ondelete='cascade'))
    score: Mapped[Double] = mapped_column(Double)

event.listen(EnrichmentLookalikeScore, "before_insert", create_timestamps)
event.listen(EnrichmentLookalikeScore, "before_update", update_timestamps)
