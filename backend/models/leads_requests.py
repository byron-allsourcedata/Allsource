from sqlalchemy import Column, Integer, VARCHAR, ForeignKey, TIMESTAMP

from .base import Base


class LeadsRequests(Base):
    __tablename__ = 'leads_requests'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads_users.id'), nullable=False)
    page = Column(VARCHAR(1024), nullable=False)
    page_parameters = Column(VARCHAR(1024), nullable=True)
    requested_at = Column(TIMESTAMP, nullable=False)
    visit_id = Column(Integer, ForeignKey('leads_visits.id'), nullable=False)
    spent_time_sec = Column(Integer, nullable=False)