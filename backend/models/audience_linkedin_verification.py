from datetime import datetime, timezone

from sqlalchemy import Column, TIMESTAMP, ForeignKey, Index, UUID, text, Boolean, Text, event

from models.audience_smarts_persons import AudienceSmartPerson
from .base import Base, update_timestamps


class AudienceLinkedinVerification(Base):
    __tablename__ = "audience_linkedins_verification"
    __table_args__ = (
        Index('audience_linkedins_verification_linkedin_url_idx', 'linkedin_url', unique=True),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    audience_smart_person_id = Column(
        UUID(as_uuid=True),
        ForeignKey(AudienceSmartPerson.id, ondelete='CASCADE'),
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
    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

event.listen(AudienceLinkedinVerification, "before_update", update_timestamps)
