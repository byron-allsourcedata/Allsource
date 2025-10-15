from datetime import datetime, timezone
import uuid

from sqlalchemy.dialects.postgresql import BYTEA
from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    TIMESTAMP,
    ForeignKey,
    JSON,
    UUID,
    Index,
    text,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import ENUM
from enums import LookalikeStatus, LookalikeGenerationType
from .base import Base

lookalike_type = ENUM(
    "ml",
    "simple_all",
    "simple_any",
    name="lookalike_generation_type",
    create_type=True,
)


class AudienceLookalikes(Base):
    __tablename__ = "audience_lookalikes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    lookalike_size: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[LookalikeStatus] = mapped_column(
        String(32), nullable=False, server_default=LookalikeStatus.NEW.value
    )
    created_date: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_by_user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    processed_size: Mapped[int] = mapped_column(
        Integer, server_default="0", nullable=False
    )
    size: Mapped[int] = mapped_column(
        Integer, server_default="0", nullable=False
    )
    source_uuid: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("audience_sources.id", ondelete="CASCADE"),
        nullable=False,
    )
    significant_fields: Mapped[dict[str, str] | None] = mapped_column(
        JSON, nullable=True
    )
    similarity_score: Mapped[dict[str, str] | None] = mapped_column(
        JSON, nullable=True
    )
    insights: Mapped[bytes | None] = mapped_column(BYTEA, nullable=True)
    processed_train_model_size: Mapped[int] = mapped_column(
        Integer, server_default="0", nullable=False
    )
    train_model_size: Mapped[int] = mapped_column(
        Integer, server_default="0", nullable=False
    )
    generation_type: Mapped[LookalikeGenerationType] = mapped_column(
        String(32),
        nullable=False,
        server_default=LookalikeGenerationType.ML.value,
    )

    __table_args__ = (
        Index(
            "audience_lookalikes_user_id_created_date_idx",
            user_id,
            created_date,
        ),
        Index("audience_lookalikes_user_id_idx", user_id),
        Index("audience_lookalikes_created_date_idx", created_date),
        Index("audience_lookalikes_name_idx", name),
        Index("audience_lookalikes_user_id_uuid_idx", user_id, id),
        Index(
            "audience_lookalikes_size_processed_size_idx", size, processed_size
        ),
    )
