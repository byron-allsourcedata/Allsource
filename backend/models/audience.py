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
    created_at = Column(TIMESTAMP(precision=7), nullable=False)


event.listen(Audience, "before_insert", create_timestamps)
event.listen(Audience, "before_update", update_timestamps)
