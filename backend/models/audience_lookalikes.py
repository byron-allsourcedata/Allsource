from sqlalchemy import Column, Integer, TIMESTAMP, VARCHAR, ForeignKey, Index, UUID
from .base import Base


class AudienceLookalikes(Base):
    __tablename__ = 'audience_lookalikes'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    name = Column(VARCHAR(128), nullable=False)
    lookalike_size = Column(VARCHAR(32), nullable=False)
    created_date = Column(TIMESTAMP, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='cascade'), nullable=False)
    created_by_user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    processed_size = Column(Integer, default=0, nullable=False)
    size = Column(Integer, default=0, nullable=False)
    source_uuid = Column(UUID(as_uuid=True),
                         ForeignKey('audience_sources.id', ondelete='cascade'), nullable=False)
