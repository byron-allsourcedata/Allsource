from datetime import datetime, timezone
from sqlalchemy import (
    TIMESTAMP,
    VARCHAR,
    BigInteger,
    Boolean,
    ForeignKey,
    UUID,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column
import uuid
from .base import Base


class MillionVerifyFiles(Base):
    __tablename__ = "million_verify_files"
    __table_args__ = (
        Index("ix_mvf_file_id", "file_id"),
        Index("ix_mvf_origin_aud_id", "origin_aud_id"),
        Index("ix_mvf_md5_hash", "md5_hash"),
        Index("uq_mvf_file_md5", "file_id", "md5_hash", unique=True),
    )

    file_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        nullable=False,
    )
    is_ready: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    md5_hash: Mapped[str] = mapped_column(VARCHAR(32), nullable=False)
    origin_aud_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("audience_smarts.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
    )
