from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey, UUID, BOOLEAN, text, Boolean

from models.audience_smarts import AudienceSmart
from models.enrichment_users import EnrichmentUser
from .base import Base
from sqlalchemy.sql import func


class AudienceSmartPerson(Base):
    __tablename__ = 'audience_smarts_persons'

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        unique=True,
        nullable=False,
        server_default=text('uuid_generate_v1()')
    )
    smart_audience_id = Column(
        UUID(as_uuid=True),
        ForeignKey('audience_smarts.id', ondelete='CASCADE'),
        nullable=False
    )
    enrichment_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey('enrichment_users.id'),
        nullable=True
    )
    is_valid = Column(
        Boolean,
        nullable=False,
        server_default=text('false')
    )
    is_validation_processed = Column(
        Boolean,
        nullable=True,
        server_default=text('true')
    )
    created_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=func.now()
    )
    updated_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )
