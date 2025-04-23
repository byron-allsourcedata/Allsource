from sqlalchemy import Column, TIMESTAMP, VARCHAR, Index, UUID, text, Boolean, Text
from .base import Base
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.sql import func

# enrichment_phone_verification_statuses = ENUM(
#     'connected', 'connected-75', 'disconnected', 'disconnected-75', 'busy', 'unreachable', 'invalid phone', 'restricted'
#     name='enrichment_phone_verification_statuses', create_type=True
# )

class EnrichmentPhoneVerification(Base):
    __tablename__ = "enrichment_phones_verification"
    __table_args__ = (
        Index('enrichment_phones_verification_phone_idx', 'phone', unique=True),
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
