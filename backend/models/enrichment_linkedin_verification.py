from sqlalchemy import Column, TIMESTAMP, ForeignKey, Index, UUID, text, Boolean, Text
from .base import Base
from sqlalchemy.sql import func
from models.audience_smarts import AudienceSmart


class EnrichmentLinkedinVerification(Base):
    __tablename__ = "enrichment_linkedin_verification"
    __table_args__ = (
        Index('enrichment_linkedin_verification_linkedin_url_idx', 'linkedin_url', unique=True),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    audience_smart_person_id = Column(
        UUID(as_uuid=True),
        ForeignKey(AudienceSmart.id, ondelete='CASCADE'),
        nullable=False
    )
    linkedin_url = Column(
        Text, 
        nullable=False
    )
    is_verify = Column(
        Boolean, 
        nullable=False
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
