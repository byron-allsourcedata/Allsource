from sqlalchemy import Column, Integer, VARCHAR, ForeignKey, TIMESTAMP, Index

from .base import Base
from .five_x_five_users import FiveXFiveUser
from .leads_visits import LeadsVisits
from .leads_users import LeadUser
from .users_domains import UserDomains


class LeadsRequests(Base):
    __tablename__ = 'leads_requests'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey(LeadUser.id), nullable=False)
    page = Column(VARCHAR(1024), nullable=False)
    page_parameters = Column(VARCHAR(1024), nullable=True)
    requested_at = Column(TIMESTAMP, nullable=False)
    visit_id = Column(Integer, ForeignKey(LeadsVisits.id), nullable=False)
    spent_time_sec = Column(Integer, nullable=False)
    domain_id = Column(Integer, ForeignKey(UserDomains.id), nullable=False)
    five_x_five_user_id = Column(Integer, ForeignKey(FiveXFiveUser.id), nullable=False)

Index('leads_requests_visit_id_idx', LeadsRequests.visit_id)
Index('leads_requests_lead_id_requested_at_idx', LeadsRequests.lead_id, LeadsRequests.requested_at)