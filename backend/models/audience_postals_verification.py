from datetime import datetime, timezone

from sqlalchemy import Column, TIMESTAMP, Index, UUID, text, Boolean, VARCHAR, event

from .base import Base, update_timestamps


class AudiencePostalVerification(Base):
    __tablename__ = "audience_postals_verification"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    postal_code = Column(
        VARCHAR, 
        nullable=False
    )
    is_verified = Column(
        Boolean, 
        nullable=False
    )
    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    __table_args__ = (
        Index('audience_postals_verification_postal_code_idx', postal_code, unique=True),
    )

event.listen(AudiencePostalVerification, "before_update", update_timestamps)
