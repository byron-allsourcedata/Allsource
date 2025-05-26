from datetime import datetime, timezone

from sqlalchemy import Column, TEXT, BigInteger, Sequence
from sqlalchemy.dialects.postgresql import TIMESTAMP, VARCHAR

from .base import Base


class SuppressionList(Base):
    __tablename__ = 'suppressions_lists'

    id = Column(
        BigInteger,
        Sequence('suppressions_list_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    list_name = Column(
        VARCHAR(256),
        nullable=True
    )
    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    total_emails = Column(
        TEXT,
        nullable=True
    )
    status = Column(
        VARCHAR(32),
        nullable=True
    )
    domain_id = Column(
        BigInteger,
        nullable=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "list_name": self.list_name,
            "created_at": self.created_at,
            "total_emails": self.total_emails,
            "status": self.status
        }

