from sqlalchemy import UUID, Column, ForeignKey, TIMESTAMP, event, text
from sqlalchemy.dialects.postgresql import BYTEA
from sqlalchemy.orm import mapped_column, Mapped

from models.base import Base, create_timestamps


class EnrichmentModels(Base):
    __tablename__ = 'enrichment_models'

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    lookalike_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('audience_lookalikes.id', ondelete='cascade'),
        nullable=False
    )
    model: Mapped[bytes] = mapped_column(
        BYTEA,
        nullable=False
    )
    created_at = Column(
        TIMESTAMP,
        nullable=True
    )


event.listen(EnrichmentModels, "before_insert", create_timestamps)
