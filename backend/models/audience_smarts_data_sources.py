from sqlalchemy import Column, event, TIMESTAMP, JSON, VARCHAR, Index, UUID, ForeignKey, text, String

from .audience_lookalikes import AudienceLookalikes
from .audience_smarts import AudienceSmart
from .audience_sources import AudienceSource
from .base import Base


class AudienceSmartsDataSources(Base):
    __tablename__ = 'audience_smarts_data_sources'
    __table_args__ = (
        # Index('audience_smarts_data_sources_pkey', 'id', unique=True),
    )

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
