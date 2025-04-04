from sqlalchemy import Column, Integer, TEXT, UUID, SmallInteger, Boolean
from sqlalchemy.dialects.postgresql import INT4RANGE
from .base import Base


class Email(Base):
    __tablename__ = 'emails'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    email = Column(TEXT, nullable=False)
    