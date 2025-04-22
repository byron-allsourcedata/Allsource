from sqlalchemy import Column, Integer, VARCHAR, ForeignKey, TIMESTAMP, Index, BigInteger, text

from .base import Base
from .five_x_five_users import FiveXFiveUser
from .leads_visits import LeadsVisits
from .leads_users import LeadUser
from .users_domains import UserDomains


class LeadsRequests(Base):
    __tablename__ = 'leads_requests'
    __table_args__ = (
        Index('leads_requests_lead_id_requested_at_idx', 'lead_id', 'requested_at', unique=True),
        Index('leads_requests_visit_id_idx', 'visit_id'),
    )

    id = Column(
        BigInteger,
        primary_key=True,
        nullable=False,
        server_default=text("nextval('leads_requests_id_seq'::regclass)")
    )
    lead_id = Column(
        BigInteger,
        ForeignKey('leads_users.id', ondelete='CASCADE'),
        nullable=True
    )
    page = Column(VARCHAR(1024), nullable=False)
    requested_at = Column(TIMESTAMP, nullable=False)
    visit_id = Column(
        BigInteger,
        ForeignKey('leads_visits.id', ondelete='CASCADE'),
        nullable=False
    )
    page_parameters = Column(VARCHAR(1024), nullable=True)
    spent_time_sec = Column(BigInteger, nullable=False)
    domain_id = Column(
        Integer,
        ForeignKey('users_domains.id', ondelete='SET NULL'),
        nullable=True
    )
    five_x_five_user_id = Column(
        Integer,
        ForeignKey('5x5_users.id', ondelete='SET NULL'),
        nullable=True
    )
