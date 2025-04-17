from sqlalchemy import Column, event, TIMESTAMP, JSON, VARCHAR, Index, UUID, ForeignKey

from .audience_lookalikes import AudienceLookalikes
from .audience_smarts import AudienceSmart
from .audience_sources import AudienceSource
from .base import Base


class AudienceSmartsDataSources(Base):
    __tablename__ = 'audience_smarts_data_sources'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    smart_audience_id = Column(UUID, ForeignKey(AudienceSmart.id, ondelete='cascade'), nullable=False)
    data_type = Column(VARCHAR(16), nullable=False)
    source_id = Column(UUID, ForeignKey(AudienceSource.id), nullable=True)
    lookalike_id = Column(UUID, ForeignKey(AudienceLookalikes.id), nullable=True)


Index('audience_smarts_data_sources_pkey', AudienceSmartsDataSources.id)


