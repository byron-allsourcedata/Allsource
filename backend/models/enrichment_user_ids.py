from sqlalchemy import Column, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID
from .base import Base


class EnrichmentUserId(Base):
    __tablename__ = 'enrichment_user_ids'
    __table_args__ = (
        UniqueConstraint('asid', name='enrichment_user_ids_asid_key'),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    asid = Column(
        UUID(as_uuid=True),
        nullable=False
    )
