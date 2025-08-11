from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    TIMESTAMP,
    Sequence,
    Index,
    UniqueConstraint,
)
from .base import Base


class FiveXFiveAnonymousCookieSync(Base):
    __tablename__ = "5x5_anonymous_cookie_sync"

    id = Column(
        Integer, Sequence("5x5_anonymous_cookie_sync_id_seq"), primary_key=True
    )
    trovo_id = Column(String(128), nullable=True)
    partner_id = Column(String(128), nullable=True)
    partner_uid = Column(Text, nullable=True)
    ip = Column(String(64), nullable=True)
    json_headers = Column(Text, nullable=True)
    event_date = Column(TIMESTAMP, nullable=True)
    file_name = Column(String(256), nullable=True)
