from datetime import datetime, timezone

from sqlalchemy import Column, TIMESTAMP, ForeignKey, BigInteger, String, Sequence, event

from .base import Base, update_timestamps


class ApiKeys(Base):
    __tablename__ = 'api_keys'

    id = Column(
        BigInteger,
        Sequence('api_keys_id_seq'),
        primary_key=True,
        nullable=False
    )
    api_key = Column(String(256), nullable=True)
    api_id = Column(String(256), nullable=True)
    name = Column(String(256), nullable=True)
    description = Column(String(256), nullable=True)
    last_used_at = Column(TIMESTAMP(timezone=False),default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    created_date = Column(TIMESTAMP(timezone=False),default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    user_id = Column(
        BigInteger,
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=True
    )

event.listen(ApiKeys, "before_update", update_timestamps)
