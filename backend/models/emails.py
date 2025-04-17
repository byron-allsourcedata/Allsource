from sqlalchemy import Column, TEXT, UUID
from sqlalchemy.orm import relationship
from .base import Base


class Email(Base):
    __tablename__ = 'emails'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    email = Column(TEXT, nullable=False)
    
    email_enrichment = relationship("EmailEnrichment", back_populates="email")
    