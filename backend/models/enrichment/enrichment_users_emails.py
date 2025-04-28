import uuid

from sqlalchemy import UniqueConstraint, text, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from models.enrichment.enrichment_users import EnrichmentUser
from models.base import Base


class EnrichmentUsersEmails(Base):
    __tablename__ = "enrichment_users_emails"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True,
        server_default=text("gen_random_uuid()")
    )
    enrichment_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            EnrichmentUser.id,
            ondelete="CASCADE",
            onupdate="CASCADE"
        ),
        nullable=False
    )
    email_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "enrichment_emails.id",
            ondelete="CASCADE",
            onupdate="CASCADE"
        ),
        nullable=False
    )
    
    __table_args__ = (
        UniqueConstraint(enrichment_user_id, email_id, name="uq_enrichment_users_emails_user_email"),
        Index("ix_enrichment_users_emails_email_id", email_id),
        Index("ix_enrichment_users_emails_user_id", enrichment_user_id),
    )