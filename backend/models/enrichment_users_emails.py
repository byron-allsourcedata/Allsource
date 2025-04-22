import uuid

from sqlalchemy import UniqueConstraint, text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from models.base import Base


class EnrichmentUsersEmails(Base):
    __tablename__ = "enrichment_users_emails"
    __table_args__ = (
        UniqueConstraint(
            "enrichment_user_id", "email_id",
            name="uq_enrichment_users_emails_user_email"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True,
        server_default=text("gen_random_uuid()")
    )
    enrichment_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "enrichment_users.id",
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

    email: Mapped["EnrichmentEmails"] = relationship(
        "EnrichmentEmails",
        back_populates="users"
    )
