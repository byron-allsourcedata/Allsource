from sqlalchemy import Column, Integer, Text, VARCHAR, TIMESTAMP
from .base import Base


class LeadVisits(Base):
    __tablename__ = 'lead_visits'

    id = Column(Integer, primary_key=True)
    leads_users_id = Column(VARCHAR, nullable=False)
    visited_at = Column(TIMESTAMP, nullable=False)
    page = Column(Text, nullable=True)
