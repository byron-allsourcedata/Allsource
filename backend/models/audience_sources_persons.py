from sqlalchemy import Column, event, Integer, TIMESTAMP, JSON, ForeignKey, Index
from .base import Base, create_timestamps, update_timestamps


class AudienceSourcesPerson(Base):
    __tablename__ = 'audience_sources_persons'

    id = Column(Integer, primary_key=True)
    source_id = Column(Integer, ForeignKey('audience_sources.id'), nullable=False)
    five_x_five_user_id = Column(Integer, ForeignKey('five_x_five_users.id'), nullable=False)
    mapped_fields = Column(JSON, nullable=False)
    created_at = Column(TIMESTAMP, nullable=False)
    updated_at = Column(TIMESTAMP, nullable=False)

    __table_args__ = (
        Index('audience_sources_persons_pkey', 'id'),
    )

event.listen(AudienceSourcesPerson, "before_insert", create_timestamps)
event.listen(AudienceSourcesPerson, "before_update", update_timestamps)