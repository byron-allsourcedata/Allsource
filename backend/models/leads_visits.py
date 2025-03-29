from sqlalchemy import Column, Integer, DATE, TIME, VARCHAR, ForeignKey

from .base import Base
from .five_x_five_users import FiveXFiveUser
from .users_domains import UserDomains


class LeadsVisits(Base):
    __tablename__ = 'leads_visits'

    id = Column(Integer, primary_key=True)
    start_date = Column(DATE, nullable=True)
    start_time = Column(TIME, nullable=True)
    end_date = Column(DATE, nullable=True)
    end_time = Column(TIME, nullable=True)
    pages_count = Column(Integer, nullable=True, unique=True)
    average_time_sec = Column(Integer, nullable=True, default=10)
    full_time_sec = Column(Integer, nullable=True, default=10)
    lead_id = Column(Integer, ForeignKey('leads_users.id'), nullable=False)
    behavior_type = Column(VARCHAR, nullable=True)
    domain_id = Column(Integer, ForeignKey(UserDomains.id), nullable=False)
    five_x_five_user_id = Column(Integer, ForeignKey(FiveXFiveUser.id), nullable=False)
