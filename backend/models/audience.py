from sqlalchemy import Column, Integer, VARCHAR, event
from sqlalchemy import TIMESTAMP

from .base import Base
from .base import create_timestamps, update_timestamps


class Audience(Base):
    __tablename__ = 'audience'

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(VARCHAR, nullable=False)
    user_id = Column(Integer, nullable=False)
    type = Column(VARCHAR, nullable=True)
    status = Column(VARCHAR, default='New', nullable=False)
    created_at = Column(TIMESTAMP, nullable=False)
    exported_on = Column(TIMESTAMP, nullable=True)


event.listen(Audience, "before_insert", create_timestamps)
event.listen(Audience, "before_update", update_timestamps)
