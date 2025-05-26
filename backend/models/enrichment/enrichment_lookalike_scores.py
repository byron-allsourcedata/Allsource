from decimal import Decimal

from sqlalchemy import Numeric, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import mapped_column, Mapped

from models.base import Base


class EnrichmentLookalikeScore(Base):
    __tablename__ = 'enrichment_lookalike_scores'

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    lookalike_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('audience_lookalikes.id', ondelete='CASCADE'),
        nullable=False
    )
    enrichment_user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('enrichment_users.id', ondelete='CASCADE'),
        nullable=False
    )
    score: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=True,
        server_default=text('0')
    )
