from sqlalchemy import Column, Integer, ForeignKey, UUID
from models.enrichment_users import EnrichmentUser
from models.emails import Email
from .base import Base


class EmailEnrichment(Base):
    __tablename__ = 'emails_enrichment'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    enrichment_user_id = Column(UUID, ForeignKey(EnrichmentUser.id), nullable=False)
    email_id = Column(UUID, ForeignKey(Email.id), nullable=False)
    




