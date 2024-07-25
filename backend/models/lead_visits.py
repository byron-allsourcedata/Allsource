from sqlalchemy import Column, Integer
from sqlalchemy.dialects.postgresql import TIMESTAMP, VARCHAR
from .base import Base


class LeadVisits(Base):
    __tablename__ = 'lead_visits'

    id = Column(Integer, primary_key=True)
    leads_users_id = Column(VARCHAR)
    visited_at = Column(TIMESTAMP(precision=7))
    referer = Column(VARCHAR)
