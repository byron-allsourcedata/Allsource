from sqlalchemy import Column, event, Integer, TIMESTAMP, JSON, ForeignKey, Index, UUID, String, Float, DECIMAL, VARCHAR

from .audience_sources import AudienceSource
from models.enrichment_users import EnrichmentUser
from .base import Base, create_timestamps, update_timestamps
from .five_x_five_users import FiveXFiveUser


class AudienceSourcesMatchedPerson(Base):
    __tablename__ = 'audience_sources_matched_persons'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    source_id = Column(UUID(as_uuid=True), ForeignKey(AudienceSource.id, ondelete='cascade'), nullable=False)
    enrichment_user_id = Column(UUID, ForeignKey(EnrichmentUser.id), nullable=True)
    five_x_five_user_id = Column(Integer, ForeignKey(FiveXFiveUser.id, ondelete='cascade'), nullable=True)
    mapped_fields = Column(JSON, nullable=True)

    email = Column(VARCHAR(64), nullable=False)
    start_date = Column(TIMESTAMP, nullable=True)
    end_date = Column(TIMESTAMP, nullable=True)
    recency = Column(Integer, nullable=True, default=0)
    recency_min = Column(Integer, nullable=True, default=0)
    recency_max = Column(Integer, nullable=True, default=0)
    inverted_recency = Column(DECIMAL(10, 2), default=0)
    inverted_recency_min = Column(DECIMAL(10, 2), default=0)
    inverted_recency_max = Column(DECIMAL(10, 2), default=0)
    duration = Column(DECIMAL(10, 2), default=0)
    recency_score = Column(DECIMAL(10, 2), default=0)
    view_score = Column(DECIMAL(10, 2), default=0)
    value_score = Column(DECIMAL(10, 2), default=0)
    amount = Column(Integer, default=0)
    amount_min = Column(Integer, default=0)
    amount_max = Column(Integer, default=0)
    count = Column(Integer, default=1)
    count_min = Column(Integer, default=1)
    count_max = Column(Integer, default=1)
    sum_score = Column(DECIMAL(10, 2), default=0)

    created_at = Column(TIMESTAMP, nullable=False)
    updated_at = Column(TIMESTAMP, nullable=False)

    __table_args__ = (
        Index('audience_sources_matched_persons_source_id_idx', 'source_id'),
    )

event.listen(AudienceSourcesMatchedPerson, "before_insert", create_timestamps)
event.listen(AudienceSourcesMatchedPerson, "before_update", update_timestamps)
