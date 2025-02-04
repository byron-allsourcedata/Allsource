from sqlalchemy import Column, Integer, VARCHAR, ForeignKey, TIMESTAMP

from .base import Base


class LeadsRequests(Base):
    __tablename__ = 'leads_requests'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads_users.id'), nullable=False)
    page = Column(VARCHAR(1024), nullable=True)
    page_parameters = Column(VARCHAR(256), nullable=True)
    requested_at = Column(TIMESTAMP, nullable=True)
    visit_id = Column(Integer, ForeignKey('leads_visits.id'), nullable=False)
