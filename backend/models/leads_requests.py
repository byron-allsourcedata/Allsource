from sqlalchemy import Column, Integer, VARCHAR, ForeignKey, TIMESTAMP

from .base import Base


class LeadsRequests(Base):
    __tablename__ = 'leads_requests'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads.id'), nullable=False)
    page = Column(VARCHAR, nullable=True)
    requested_at = Column(TIMESTAMP, nullable=True)
    time_sec = Column(Integer, nullable=True, default=10)
    visit_id = Column(Integer, nullable=False)
