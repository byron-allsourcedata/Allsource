from sqlalchemy import Column, Integer, ForeignKey, UUID
from sqlalchemy.orm import relationship
from models.emails import Email
from .base import Base


class EmailEnrichment(Base):
    __tablename__ = 'emails_enrichment'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    enrichment_user_id = Column(UUID, ForeignKey('enrichment_users.id', ondelete='cascade'), nullable=False)
    email_id = Column(UUID, ForeignKey('emails.id'), nullable=False)

    enrichment_user = relationship("EnrichmentUser", back_populates="emails_enrichment")
    email = relationship("Email", back_populates="email_enrichment")

    




