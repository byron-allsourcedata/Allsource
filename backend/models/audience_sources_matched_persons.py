from sqlalchemy import Column, event, Integer, TIMESTAMP, JSON, ForeignKey, Index, UUID, String, Float, DECIMAL, VARCHAR

from .audience_sources import AudienceSource
from models.enrichment_users import EnrichmentUser
from .base import Base, create_timestamps, update_timestamps


class AudienceSourcesMatchedPerson(Base):
    __tablename__ = 'audience_sources_matched_persons'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    source_id = Column(UUID(as_uuid=True), ForeignKey(AudienceSource.id, ondelete='cascade'), nullable=False)
    enrichment_user_id = Column(UUID, ForeignKey(EnrichmentUser.id), nullable=True)
    mapped_fields = Column(JSON, nullable=True)

    first_name = Column(VARCHAR(64), nullable=True)
    last_name = Column(VARCHAR(64), nullable=True)
    email = Column(VARCHAR(64), nullable=False)
    orders_amount = Column(DECIMAL(10, 2), default=0)
    orders_amount_normalized = Column(DECIMAL(10, 2), default=0)
    orders_count = Column(Integer, default=1)
    orders_count_normalized = Column(DECIMAL(10, 2), default=0)
    orders_date = Column(TIMESTAMP, nullable=True)
    recency = Column(Integer, nullable=True, default=0)
    recency_normalized = Column(DECIMAL(10, 2), default=0)
    value_score = Column(DECIMAL(10, 2), default=0)
    inverted_recency = Column(DECIMAL(10, 2), default=0)
    recency_failed = Column(DECIMAL(10, 2), default=0)
    view_score = Column(DECIMAL(10, 2), default=0)
    created_at = Column(TIMESTAMP, nullable=False)
    updated_at = Column(TIMESTAMP, nullable=False)

    __table_args__ = (
        Index('audience_sources_matched_persons_source_id_idx', 'source_id'),
    )

event.listen(AudienceSourcesMatchedPerson, "before_insert", create_timestamps)
event.listen(AudienceSourcesMatchedPerson, "before_update", update_timestamps)
