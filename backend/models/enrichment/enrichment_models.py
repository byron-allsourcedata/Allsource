from datetime import datetime, timezone

from sqlalchemy import UUID, Column, ForeignKey, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import BYTEA
from sqlalchemy.orm import mapped_column, Mapped

from models.base import Base


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
    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
