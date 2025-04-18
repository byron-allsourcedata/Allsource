from sqlalchemy import UUID, Column, ForeignKey, TIMESTAMP, event
from sqlalchemy.dialects.postgresql import BYTEA
from sqlalchemy.orm import mapped_column, Mapped

from .audience_lookalikes import AudienceLookalikes
from .base import Base, create_timestamps

class EnrichmentModels(Base):
    __tablename__ = 'enrichment_models'

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, unique=True, server_default="gen_random_uuid()")
    lookalike_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), ForeignKey(AudienceLookalikes.id, ondelete='cascade'))
    model: Mapped[bytes] = mapped_column(BYTEA)
    created_at = Column(TIMESTAMP, nullable=False)
    
event.listen(EnrichmentModels, "before_insert", create_timestamps)
