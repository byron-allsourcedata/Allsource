from datetime import datetime, timezone

from sqlalchemy import Column, event, TIMESTAMP, ForeignKey, Index, UUID, text

from models.audience_lookalikes import AudienceLookalikes
from models.enrichment.enrichment_users import EnrichmentUser
from .base import Base, update_timestamps


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
    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    
    __table_args__ = (
        Index('audience_smarts_persons_lookalike_id', lookalike_id),
    )
