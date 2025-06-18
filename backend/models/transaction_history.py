
from sqlalchemy import (
    UUID,
    Column,
    text,
    VARCHAR,
    TIMESTAMP,
    Integer,
    ForeignKey,
)
from .base import Base


class TransactionHistory(Base):
    __tablename__ = "transaction_history"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        unique=True,
        nullable=False,
        server_default=text("gen_random_uuid()"),
    )
    event_name = Column(VARCHAR(32), nullable=False)
    identifier = Column(VARCHAR(64), nullable=False)
    customer_id = Column(
        VARCHAR(32), nullable=False
    )
    quantity = Column(Integer, nullable=False)
    created = Column(
        TIMESTAMP,
        nullable=False,
    )
