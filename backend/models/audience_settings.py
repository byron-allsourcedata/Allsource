from sqlalchemy import Column, TIMESTAMP, TEXT, VARCHAR, UUID, text, String, Text
from .base import Base
from sqlalchemy.sql import func


class AudienceSetting(Base):
    __tablename__ = 'audience_settings'

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        unique=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    alias = Column(String, nullable=False)
    value = Column(Text, nullable=False)
    created_at = Column(
        TIMESTAMP,
        server_default=text('now()'),
        nullable=False
    )
    updated_at = Column(
        TIMESTAMP,
        server_default=text('now()'),
        onupdate=text('now()'),
        nullable=False
    )
