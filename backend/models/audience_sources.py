from sqlalchemy import Column, event, Integer, TIMESTAMP, JSON, VARCHAR, ForeignKey, Index, UUID
from .base import Base, create_timestamps, update_timestamps


class AudienceSource(Base):
    __tablename__ = 'audience_sources'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    user_id = Column(Integer, ForeignKey('users.id', onupdate='SET NULL'), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey('users.id', onupdate='SET NULL'), nullable=True)
    created_at = Column(TIMESTAMP, nullable=False)
    updated_at = Column(TIMESTAMP, nullable=False)
    name = Column(VARCHAR(128), nullable=False)
    source_type = Column(VARCHAR(64), nullable=False)
    source_origin = Column(VARCHAR(64), nullable=False)
    matched_records = Column(Integer, default=0, nullable=False)
    total_records = Column(Integer, nullable=True)
    matched_records_status = Column(VARCHAR(16), default='pending', nullable=False)
    processed_records = Column(Integer, default=0, nullable=False)
    file_url = Column(VARCHAR(256), nullable=True)
    mapped_fields = Column(JSON, nullable=True)

    __table_args__ = (
        Index('audience_sources_pkey', 'id'),
        Index('audience_sources_user_id_idx', 'user_id'),
        Index('audience_sources_matched_records_idx', 'matched_records'),
        Index('audience_sources_total_records_idx', 'total_records'),
    )

event.listen(AudienceSource, "before_insert", create_timestamps)
event.listen(AudienceSource, "before_update", update_timestamps)