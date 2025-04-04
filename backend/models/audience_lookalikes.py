from sqlalchemy import Column, Integer, TIMESTAMP, VARCHAR, ForeignKey, JSON, UUID
from .base import Base
from models.audience_sources import AudienceSource


class AudienceLookalikes(Base):
    __tablename__ = 'audience_lookalikes'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    name = Column(VARCHAR(128), nullable=False)
    lookalike_size = Column(VARCHAR(32), nullable=False)
    target_schema = Column(VARCHAR(16), nullable=False)
    created_date = Column(TIMESTAMP, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='cascade'), nullable=False)
    created_by_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    processed_size = Column(Integer, default=0, nullable=False)
    size = Column(Integer, default=0, nullable=False)
    source_uuid = Column(UUID(as_uuid=True), ForeignKey(AudienceSource.id, ondelete='cascade'), nullable=False)
    significant_fields = Column(JSON, nullable=False)


Index("audiencelookalikes_user_created_date", AudienceLookalikes.user_id, AudienceLookalikes.created_date)
