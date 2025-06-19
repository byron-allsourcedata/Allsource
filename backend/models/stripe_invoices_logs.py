from datetime import datetime, timezone

from sqlalchemy import (
    UUID,
    Column,
    text,
    VARCHAR,
    TIMESTAMP,
    JSON,
)

from .base import Base


class StripeInvoiceLogs(Base):
    __tablename__ = "stripe_invoices_logs"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        unique=True,
        nullable=False,
        server_default=text("gen_random_uuid()"),
    )
    type = Column(VARCHAR(64), nullable=False)
    invoices_data = Column(JSON, nullable=False)
    created = Column(
        TIMESTAMP,
        nullable=False,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
    )
