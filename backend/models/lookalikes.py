from sqlalchemy import Column, Integer, TIMESTAMP, VARCHAR, ForeignKey, Index, UUID
from .base import Base


class Lookalikes(Base):
    __tablename__ = 'lookalikes'

    uuid = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False)
    name = Column(VARCHAR(128), nullable=False)
    source = Column(VARCHAR(64), ForeignKey('audience_sources.source_origin', onupdate='SET NULL'), nullable=False)
    source_type = Column(VARCHAR(64), ForeignKey('audience_sources.source_type', onupdate='SET NULL'), nullable=False)
    lookalike_size = Column(VARCHAR(32), nullable=False)
    created_date = Column(TIMESTAMP, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', onupdate='SET NULL'), nullable=False)
    created_by_user_id = Column(Integer, ForeignKey('users.id', onupdate='SET NULL'), nullable=False)
    processed_size = Column(Integer, default=0, nullable=False)
    size = Column(Integer, default=0, nullable=False)
    source_uuid = Column(UUID(as_uuid=True),
                         ForeignKey('audience_sources.uuid', onupdate='SET NULL'), nullable=False)
