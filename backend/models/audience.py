from sqlalchemy import Column, Integer, VARCHAR, event
from sqlalchemy import TIMESTAMP

from .base import Base
from .base import create_timestamps, update_timestamps


class Audience(Base):
    __tablename__ = 'audience'

    id = Column(Integer, primary_key=True, nullable=False)
    domain_id = Column(Integer, nullable=False)
    data_source = Column(VARCHAR, nullable=False)
    audience_type = Column(VARCHAR, nullable=False)
    audience_threshold = Column(Integer, nullable=False)
    status = Column(VARCHAR, nullable=False, default='progress')
    created_at = Column(TIMESTAMP, nullable=False)
    exported_on = Column(TIMESTAMP, nullable=True)

event.listen(Audience, "before_insert", create_timestamps)
event.listen(Audience, "before_update", update_timestamps)
