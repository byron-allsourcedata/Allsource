from sqlalchemy import Column, event, Integer, TIMESTAMP, VARCHAR, ForeignKey, Index
from .base import Base, create_timestamps, update_timestamps


class AudienceSource(Base):
    __tablename__ = 'audience_sources'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_by_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(TIMESTAMP, nullable=False)
    updated_at = Column(TIMESTAMP, nullable=False)
    name = Column(VARCHAR(64), nullable=False)
    file_name = Column(VARCHAR(128), nullable=True)
    source_type = Column(VARCHAR(64), nullable=False)
    source_origin = Column(VARCHAR(64), nullable=False)
    matched_records = Column(Integer, nullable=True)
    total_records = Column(Integer, nullable=True)

    __table_args__ = (
        Index('audience_sources_pkey', 'id'),
        Index('audience_sources_user_id_idx', 'user_id'),
    )

event.listen(AudienceSource, "before_insert", create_timestamps)
event.listen(AudienceSource, "before_update", update_timestamps)