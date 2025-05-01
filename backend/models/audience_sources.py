from sqlalchemy import Column, event, Integer, TIMESTAMP, JSON, VARCHAR, ForeignKey, Index, UUID, text, func
from .base import Base, create_timestamps, update_timestamps
from models.users_domains import UserDomains
from sqlalchemy.dialects.postgresql import ENUM

target_schemas = ENUM('b2c', 'b2b', name='target_schemas', create_type=False)


class AudienceSource(Base):
    __tablename__ = 'audience_sources'
    __table_args__ = (
        # Index('audience_sources_pkey', 'id', unique=True),
        Index('audience_sources_user_id_idx', 'user_id'),
        Index('audience_sources_matched_records_idx', 'matched_records'),
        Index('audience_sources_total_records_idx', 'total_records'),
        Index('audience_sources_created_at_idx', 'created_at'),
        Index('audience_sources_user_id_uuid_idx', 'user_id', 'id'),
        Index('audience_sources_name_idx', 'name'),
        Index('audience_sources_matched_records_idx', 'matched_records'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False,
                server_default=text('gen_random_uuid()'))
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey('users.id', onupdate='SET NULL'), nullable=True)
    name = Column(VARCHAR(128), nullable=False)
    file_url = Column(VARCHAR(256), nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, server_default=text("TIMEZONE('utc', now())"))
    updated_at = Column(TIMESTAMP, nullable=False, server_default=text("TIMEZONE('utc', now())"), onupdate=text("TIMEZONE('utc', now())"))
    source_type = Column(VARCHAR(128), nullable=False)
    source_origin = Column(VARCHAR(64), nullable=False)
    matched_records = Column(Integer, nullable=False, server_default=text('0'))
    total_records = Column(Integer, nullable=False, server_default=text('0'))
    matched_records_status = Column(VARCHAR(16), nullable=False, server_default=text("'pending'"))
    processed_records = Column(Integer, nullable=False, server_default=text('0'))
    mapped_fields = Column(JSON, nullable=True)
    domain_id = Column(Integer, ForeignKey('users_domains.id', onupdate='SET NULL'), nullable=True)
    target_schema = Column(
        target_schemas,
        nullable=False,
        server_default="'b2c'"
    )
    insights = Column(JSON, nullable=True)
    significant_fields = Column(JSON, nullable=True)


event.listen(AudienceSource, "before_insert", create_timestamps)
event.listen(AudienceSource, "before_update", update_timestamps)
