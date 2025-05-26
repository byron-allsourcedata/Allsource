from datetime import datetime, timezone

from sqlalchemy import Column, event, BigInteger, Sequence, String, ForeignKey
from sqlalchemy import TIMESTAMP

from .base import Base
from .base import update_timestamps


class Audience(Base):
    __tablename__ = 'audience'

    id = Column(
        BigInteger,
        Sequence('audience_id_seq'),
        primary_key=True,
        nullable=False
    )
    name = Column(String(64), nullable=False)
    user_id = Column(
        BigInteger,
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False
    )
    type = Column(String(16), nullable=False)
    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    status = Column(String(16), nullable=False)
    exported_on = Column(TIMESTAMP, nullable=True)


event.listen(Audience, "before_update", update_timestamps)
