from sqlalchemy import Column, UUID, ForeignKey, text, String, Index

from .base import Base


class AudienceSmartsDataSources(Base):
    __tablename__ = 'audience_smarts_data_sources'

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    smart_audience_id = Column(
        UUID(as_uuid=True),
        ForeignKey('audience_smarts.id', ondelete='CASCADE'),
        nullable=False
    )
    data_type = Column(String(16), nullable=False)
    source_id = Column(
        UUID(as_uuid=True),
        ForeignKey('audience_sources.id', ondelete='CASCADE'),
        nullable=True
    )
    lookalike_id = Column(
        UUID(as_uuid=True),
        ForeignKey('audience_lookalikes.id', ondelete='CASCADE'),
        nullable=True
    )

    __table_args__ = (
        Index('audience_smarts_data_sources_pkey', id, unique=True),
    )
