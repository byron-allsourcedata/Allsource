from sqlalchemy import Column, event, Integer, TIMESTAMP, JSON, ForeignKey, Index, UUID
from .base import Base, create_timestamps, update_timestamps
from models.audience_lookalikes import AudienceLookalikes


class AudienceLookALikePerson(Base):
    __tablename__ = 'audience_lookalikes_persons'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    lookalike_id = Column(UUID, ForeignKey(AudienceLookalikes.id, ondelete='cascade'), nullable=False)
    five_x_five_user_id = Column(Integer, ForeignKey('5x5_users.id'), nullable=False)
    created_at = Column(TIMESTAMP, nullable=False)

    __table_args__ = (
        Index('audience_smarts_persons_lookalike_id', 'lookalike_id'),
    )

event.listen(AudienceLookALikePerson, "before_insert", create_timestamps)
event.listen(AudienceLookALikePerson, "before_update", update_timestamps)