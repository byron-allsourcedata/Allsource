from datetime import datetime, timezone

from sqlalchemy import (
    UUID,
    Column,
    text,
    TIMESTAMP,
    Integer,
    JSON,
)

from .base import Base


class ChargingCreditsHistory(Base):
    __tablename__ = "charging_credits_history"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        unique=True,
        nullable=False,
        server_default=text("gen_random_uuid()"),
    )
    created_at = Column(
        TIMESTAMP,
        nullable=False,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
    )
    users_count = Column(Integer, nullable=False)
    users_ids = Column(JSON, nullable=True)

