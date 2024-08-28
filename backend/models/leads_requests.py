from sqlalchemy import Column, Integer, VARCHAR, TIME, ForeignKey

from .base import Base


class LeadsRequests(Base):
    __tablename__ = 'leads_requests'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads.id'), nullable=False)
    page = Column(VARCHAR, nullable=True)
    requested_at = Column(VARCHAR, nullable=True)
    time_sec = Column(TIME, nullable=True)
    visit_id = Column(Integer, ForeignKey('leads.id'), nullable=False)
