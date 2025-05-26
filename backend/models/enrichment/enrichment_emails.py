import enum
import uuid

from sqlalchemy import UniqueConstraint, text, String, Enum as SAEnum, Index, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class EmailType(enum.Enum):
    personal = "personal"
    business = "business"
    other = "other"

class EnrichmentEmails(Base):
    __tablename__ = "enrichment_emails"
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True,
        server_default=text("gen_random_uuid()")
    )
    email: Mapped[str] = mapped_column(String, nullable=False)
    email_type: Mapped[EmailType] = mapped_column(
        SAEnum(EmailType, name="email_type", create_type=True),
        nullable=False
    )
    
    __table_args__ = (
        UniqueConstraint(email, email_type, name="uq_enrichment_emails_email_type"),
        Index("ix_enrichment_emails_norm_email", func.lower(func.trim(text("email")))),
    )