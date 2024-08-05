from sqlalchemy import Column, Integer, event
from sqlalchemy import TIMESTAMP
from sqlalchemy.dialects.postgresql import VARCHAR

from .base import Base
from .base import create_timestamps, update_timestamps


class Audience(Base):
    __tablename__ = 'audience'

    id = Column(Integer, primary_key=True)
    name = Column(VARCHAR)
    user_id = Column(Integer)
    type = Column(VARCHAR)
    status = Column(VARCHAR, default='New', nullable=False)
    created_at = Column(TIMESTAMP, nullable=False)


event.listen(Audience, "before_insert", create_timestamps)
event.listen(Audience, "before_update", update_timestamps)
