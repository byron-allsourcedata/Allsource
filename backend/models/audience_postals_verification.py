from sqlalchemy import Column, TIMESTAMP, Index, UUID, text, Boolean, Integer, VARCHAR
from .base import Base
from sqlalchemy.sql import func


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
    __table_args__ = (
        Index('audience_postals_verification_postal_code_idx', postal_code, unique=True),
    )
