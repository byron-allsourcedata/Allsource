from sqlalchemy import Column, Integer, ForeignKey, UUID, text
from sqlalchemy.orm import relationship
from models.emails import Email
from .base import Base


class EmailEnrichment(Base):
    __tablename__ = 'emails_enrichment'

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    enrichment_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey('enrichment_users.id', ondelete='CASCADE'),
        nullable=False
    )
    email_id = Column(
        UUID(as_uuid=True),
        ForeignKey('emails.id', ondelete='CASCADE'),
        nullable=False
    )

    enrichment_user = relationship("EnrichmentUser", back_populates="emails_enrichment")
    email = relationship("Email", back_populates="email_enrichment")
