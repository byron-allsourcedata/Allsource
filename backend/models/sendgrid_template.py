from datetime import datetime, timezone

from sqlalchemy import Column, Sequence
from sqlalchemy.dialects.postgresql import BIGINT, TIMESTAMP, VARCHAR

from .base import Base


class SendgridTemplate(Base):
    __tablename__ = 'sendgrid_templates'

    id = Column(
        BIGINT,
        Sequence('send_grid_templates_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    alias = Column(
        VARCHAR,
        nullable=True
    )
    template_id = Column(
        VARCHAR,
        nullable=True
    )
    subject = Column(
        VARCHAR,
        nullable=True
    )
    description = Column(
        VARCHAR,
        nullable=True
    )
    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(
        TIMESTAMP(precision=7),
        nullable=False
    )
