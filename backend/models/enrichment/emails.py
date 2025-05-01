from sqlalchemy import Column, TEXT, UUID, text, Index
from sqlalchemy.orm import relationship
from models.base import Base


class Email(Base):
    __tablename__ = 'emails'

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    email = Column(TEXT, nullable=False)
    
    __table_args__ = (
        Index('idx_emails_email', email, unique=True),
        Index('idx_emails_email_fulltext', text("to_tsvector('english', email)"), postgresql_using='gin'),
    )

from .emails_enrichment import EmailEnrichment

Email.email_enrichment = relationship(EmailEnrichment, back_populates="email", cascade="all, delete-orphan")
