from sqlalchemy import Column, event, Integer, TEXT, BigInteger, text
from sqlalchemy.dialects.postgresql import TIMESTAMP, VARCHAR
from .base import Base, create_timestamps


class SuppressionList(Base):
    __tablename__ = 'suppressions_lists'

    id = Column(
        BigInteger,
        primary_key=True,
        nullable=False,
        server_default=text("nextval('suppressions_list_id_seq'::regclass)")
    )
    list_name = Column(
        VARCHAR(256),
        nullable=True
    )
    created_at = Column(
        TIMESTAMP(precision=7),
        nullable=True
    )
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


event.listen(SuppressionList, "before_insert", create_timestamps)
