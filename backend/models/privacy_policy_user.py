from sqlalchemy import (
    Column,
    TIMESTAMP,
    VARCHAR,
    ForeignKey,
    UUID,
    text,
    BigInteger,
)
from datetime import datetime, timezone
from .base import Base


class PrivacyPolicyUser(Base):
    __tablename__ = "privacy_policy_users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text("gen_random_uuid()"),
    )
    email = Column(VARCHAR(64), nullable=False)
    ip = Column(VARCHAR(64), nullable=False)
    version_privacy_policy = Column(VARCHAR(128), nullable=False)
    user_id = Column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at = Column(
        TIMESTAMP,
        nullable=False,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
    )
