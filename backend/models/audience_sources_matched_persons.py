from sqlalchemy import Column, event, Integer, TIMESTAMP, JSON, ForeignKey, Index, UUID, String, Float, DECIMAL, \
    VARCHAR, text, func

from .audience_sources import AudienceSource
from models.enrichment.enrichment_users import EnrichmentUser
from .base import Base, create_timestamps, update_timestamps
from .five_x_five_users import FiveXFiveUser


class AudienceSourcesMatchedPerson(Base):
    __tablename__ = 'audience_sources_matched_persons'
    __table_args__ = (
        Index('audience_sources_matched_persons_source_id_email_idx', 'source_id', 'email'),
        Index('audience_sources_matched_persons_source_id_idx', 'source_id'),

    )

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False,
                server_default=text('gen_random_uuid()'))
    source_id = Column(UUID(as_uuid=True), ForeignKey(AudienceSource.id, ondelete='CASCADE'), nullable=False)
    enrichment_user_id = Column(UUID(as_uuid=True), ForeignKey(EnrichmentUser.id), nullable=True)
    enrichment_user_asid = Column(UUID(as_uuid=True), nullable=True)
    mapped_fields = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.now(), onupdate=func.now())
    email = Column(VARCHAR(64), nullable=True)
    first_name = Column(VARCHAR(64), nullable=True)
    last_name = Column(VARCHAR(64), nullable=True)
    start_date = Column(TIMESTAMP, nullable=True)
    end_date = Column(TIMESTAMP, nullable=True)
    recency = Column(Integer, nullable=True, server_default=text('0'))
    recency_min = Column(Integer, nullable=True, server_default=text('0'))
    recency_max = Column(Integer, nullable=True, server_default=text('0'))
    inverted_recency = Column(DECIMAL(20, 5), nullable=True, server_default=text('0'))
    inverted_recency_min = Column(DECIMAL(20, 5), nullable=True, server_default=text('0'))
    inverted_recency_max = Column(DECIMAL(20, 5), nullable=True, server_default=text('0'))
    duration = Column(DECIMAL(20, 5), nullable=True, server_default=text('0'))
    recency_score = Column(DECIMAL(20, 5), nullable=True, server_default=text('0'))
    view_score = Column(DECIMAL(20, 5), nullable=True, server_default=text('0'))
    value_score = Column(DECIMAL(20, 5), nullable=True, server_default=text('0'))
    sum_score = Column(DECIMAL(20, 5), nullable=True, server_default=text('0'))
    amount = Column(Integer, nullable=True, server_default=text('0'))
    amount_min = Column(Integer, nullable=True, server_default=text('0'))
    amount_max = Column(Integer, nullable=True, server_default=text('0'))
    count = Column(Integer, nullable=True, server_default=text('1'))
    count_min = Column(Integer, nullable=True, server_default=text('1'))
    count_max = Column(Integer, nullable=True, server_default=text('1'))


event.listen(AudienceSourcesMatchedPerson, "before_insert", create_timestamps)
event.listen(AudienceSourcesMatchedPerson, "before_update", update_timestamps)
