from sqlalchemy import Column, TIMESTAMP, ForeignKey, UUID, text, Index, VARCHAR
from .base import Base
from datetime import datetime, timezone
from models.audience_smarts_persons import AudienceSmartPerson

class AudienceSmartValidation(Base):
    __tablename__ = "audience_smarts_validations"

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
    verified_phone = Column(
        VARCHAR(128),
        nullable=True
    )
    verified_business_email = Column(
        VARCHAR(128),
        nullable=True
    )
    verified_personal_email = Column(
        VARCHAR(128),
        nullable=True
    )
    created_at = Column(
        TIMESTAMP(timezone=False),
        nullable=False,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
    updated_at = Column(
        TIMESTAMP(timezone=False),
        nullable=False,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
    
    # __table_args__ = (
    #     Index('audience_smarts_created_at_idx', created_at, unique=True),
    # )
