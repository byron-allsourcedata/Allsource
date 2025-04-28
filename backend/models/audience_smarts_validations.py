from sqlalchemy import Column, TIMESTAMP, Index, ForeignKey, UUID, text, Text
from .base import Base
from sqlalchemy.sql import func
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
        Text, 
        nullable=True
    )
    verified_email = Column(
        Text, 
        nullable=True
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
