from sqlalchemy import Column, Integer, DATE, TIME, VARCHAR

from .base import Base


class LeadsVisits(Base):
    __tablename__ = 'leads_visits'

    id = Column(Integer, primary_key=True)
    start_date = Column(DATE, nullable=True)
    start_time = Column(TIME, nullable=True)
    end_date = Column(DATE, nullable=True)
    end_time = Column(TIME, nullable=True)
    pages_count = Column(Integer, nullable=True, unique=True)
    average_time_sec = Column(Integer, nullable=True)
    lead_id = Column(Integer, nullable=False)
    behavior_type = Column(VARCHAR, nullable=True)
