from sqlalchemy import Column, event, Integer, TIMESTAMP, JSON, ForeignKey, Index, UUID, String, Float

from .audience_sources import AudienceSource
from .base import Base, create_timestamps, update_timestamps


class AudienceSourcesMatchedPerson(Base):
    __tablename__ = 'audience_sources_matched_persons'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    source_id = Column(UUID(as_uuid=True), ForeignKey(AudienceSource.id, ondelete='cascade'), nullable=False)
    five_x_five_user_id = Column(Integer, ForeignKey('5x5_users.id'), nullable=False)
    mapped_fields = Column(JSON, nullable=True)

    email = Column(String, nullable=False)
    orders_amount = Column(Float, default=0)
    orders_count = Column(Integer, default=1)
    orders_date = Column(TIMESTAMP, nullable=True)
    recency = Column(Integer, nullable=True)
    value_score = Column(Float, default=0)

    created_at = Column(TIMESTAMP, nullable=False)
    updated_at = Column(TIMESTAMP, nullable=False)

    __table_args__ = (
        Index('audience_sources_matched_persons_source_id_idx', 'source_id'),
    )

event.listen(AudienceSourcesMatchedPerson, "before_insert", create_timestamps)
event.listen(AudienceSourcesMatchedPerson, "before_update", update_timestamps)
