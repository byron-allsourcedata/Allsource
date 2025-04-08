from sqlalchemy import Column, TEXT, UUID
from sqlalchemy.orm import relationship
from models.enrichment_users import EnrichmentUser
from .base import Base


class Email(Base):
    __tablename__ = 'emails'

    id = Column(UUID(as_uuid=True), primary_key=True, unique=True, nullable=False, server_default="gen_random_uuid()")
    email = Column(TEXT, nullable=False)
    users = relationship(
        EnrichmentUser,
        secondary="emails_enrichment",
        backref="emails"
    )
    