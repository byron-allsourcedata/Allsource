from sqlalchemy import Column, event, Integer, TIMESTAMP, JSON, ForeignKey, Index, UUID, text
from .base import Base, create_timestamps, update_timestamps
from models.enrichment.enrichment_users import EnrichmentUser
from models.audience_lookalikes import AudienceLookalikes


class AudienceLookalikesPerson(Base):
    __tablename__ = 'audience_lookalikes_persons'
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        unique=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    lookalike_id = Column(
        UUID(as_uuid=True),
        ForeignKey(AudienceLookalikes.id, ondelete='CASCADE'),
        nullable=False
    )
    enrichment_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey(EnrichmentUser.id, ondelete='CASCADE'),
        nullable=False
    )
    created_at = Column(
        TIMESTAMP,
        server_default=text('now()'),
        nullable=False
    )
    
    __table_args__ = (
        Index('audience_smarts_persons_lookalike_id', lookalike_id),
    )


event.listen(AudienceLookalikesPerson, 'before_insert', create_timestamps)
event.listen(AudienceLookalikesPerson, 'before_update', update_timestamps)
