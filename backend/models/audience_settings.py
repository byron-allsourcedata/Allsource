from sqlalchemy import Column, TIMESTAMP, TEXT, VARCHAR, UUID
from .base import Base
from sqlalchemy.sql import func

class AudienceSetting(Base):
    __tablename__ = 'audience_settings'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    alias = Column(VARCHAR(256), nullable=False)
    value = Column(TEXT, nullable=False)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP, nullable=False, server_default=func.now(), onupdate=func.now())

