from sqlalchemy import Column, event, Integer, TIMESTAMP, JSON, ForeignKey, Index, UUID, text
from .base import Base, create_timestamps, update_timestamps
from models.enrichment_users import EnrichmentUser
from models.audience_lookalikes import AudienceLookalikes


class AudienceLookalikesPerson(Base):
    __tablename__ = 'audience_lookalikes_persons'
    __table_args__ = (
        Index('audience_smarts_persons_lookalike_id', 'lookalike_id'),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        unique=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    lookalike_id = Column(
        UUID(as_uuid=True),
        ForeignKey('audience_lookalikes.id', ondelete='CASCADE'),
        nullable=False
    )
    enrichment_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey('enrichment_users.id', ondelete='CASCADE'),
        nullable=False
    )
    created_at = Column(
        TIMESTAMP,
        server_default=text('now()'),
        nullable=False
    )


event.listen(AudienceLookalikesPerson, 'before_insert', create_timestamps)
event.listen(AudienceLookalikesPerson, 'before_update', update_timestamps)
