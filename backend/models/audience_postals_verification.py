from sqlalchemy import Column, TIMESTAMP, Index, UUID, text, Boolean, Integer
from .base import Base
from sqlalchemy.sql import func


class AudiencePostalVerification(Base):
    __tablename__ = "audience_postals_verification"
    __table_args__ = (
        Index('audience_postals_verification_zip_code5_idx', 'zip_code5', unique=True),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    zip_code5 = Column(
        Integer, 
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
