from sqlalchemy import Column, Integer, Text, VARCHAR, DATE, TIME, ForeignKey
from .base import Base


class LeadsVisits(Base):
    __tablename__ = 'leads_visits'

    id = Column(Integer, primary_key=True)
    start_date = Column(DATE, nullable=True)
    start_time = Column(TIME, nullable=True)
    end_date = Column(DATE, nullable=True)
    end_time = Column(TIME, nullable=True)
    pages_count = Column(Integer, nullable=True)
    average_time_sec = Column(TIME, nullable=True)
    lead_id = Column(Integer, ForeignKey('leads.id'), nullable=False)
