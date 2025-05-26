from datetime import datetime, timezone

from sqlalchemy import Column, TIMESTAMP, VARCHAR, Index, UUID, text, Boolean, Text, event

from .base import Base, update_timestamps


class AudiencePhoneVerification(Base):
    __tablename__ = "audience_phones_verification"
    __table_args__ = (
        Index('audience_phones_verification_phone_idx', 'phone', unique=True),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    phone = Column(
        Text, 
        nullable=False
    )
    status = Column(
        VARCHAR(128), 
        nullable=False
    )
    is_verify = Column(
        Boolean, 
        nullable=False
    )
    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

event.listen(AudiencePhoneVerification, "before_update", update_timestamps)

