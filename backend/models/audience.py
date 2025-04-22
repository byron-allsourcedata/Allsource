from sqlalchemy import Column, Integer, VARCHAR, event, BigInteger, Sequence, String, ForeignKey, text
from sqlalchemy import TIMESTAMP

from .base import Base
from .base import create_timestamps, update_timestamps


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
    created_at = Column(
        TIMESTAMP,
        server_default=text('now()'),
        nullable=False
    )
    status = Column(String(16), nullable=False)
    exported_on = Column(TIMESTAMP, nullable=True)


event.listen(Audience, "before_insert", create_timestamps)
event.listen(Audience, "before_update", update_timestamps)
