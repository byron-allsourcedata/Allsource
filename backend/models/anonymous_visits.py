from sqlalchemy import (
    Column,
    Integer,
    VARCHAR,
    ForeignKey,
    Index,
    BigInteger,
    Date,
    Time,
    Sequence,
)

from .base import Base


class AnonymousVisits(Base):
    __tablename__ = "anonymous_visits"

    id = Column(
        BigInteger,
        Sequence("anonymous_visits_id_seq", metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    start_date = Column(Date, nullable=True)
    start_time = Column(Time, nullable=True)
    end_date = Column(Date, nullable=True)
    end_time = Column(Time, nullable=True)
    pages_count = Column(Integer, nullable=True)
    average_time_sec = Column(Integer, nullable=False, default=10)
    full_time_sec = Column(Integer, nullable=False, default=10)
    ip = Column(VARCHAR(64), nullable=True)
    trovo_id = Column(VARCHAR(128), nullable=True)
    domain_id = Column(
        Integer,
        ForeignKey("users_domains.id", ondelete="SET NULL"),
        nullable=True,
    )
