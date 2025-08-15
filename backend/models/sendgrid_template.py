from datetime import datetime, timezone

from sqlalchemy import Column, Sequence
from sqlalchemy.dialects.postgresql import BIGINT, TIMESTAMP, VARCHAR
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class SendgridTemplate(Base):
    __tablename__ = "sendgrid_templates"

    id = Column(
        BIGINT,
        Sequence("send_grid_templates_id_seq", metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    alias: Mapped[str] = mapped_column(VARCHAR, nullable=True)
    template_id: Mapped[str] = mapped_column(VARCHAR, nullable=True)
    subject = Column(VARCHAR, nullable=True)
    description = Column(VARCHAR, nullable=True)
    created_at = Column(
        TIMESTAMP,
        nullable=False,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
    )
    updated_at = Column(TIMESTAMP(precision=7), nullable=False)
