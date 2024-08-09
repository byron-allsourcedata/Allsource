from sqlalchemy import Column, Integer, VARCHAR
from .base import Base


class LeadUser(Base):
    __tablename__ = 'leads_users'

    id = Column(Integer, primary_key=True, nullable=False)
    lead_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    status = Column(VARCHAR, default='New', nullable=False)
    funnel = Column(VARCHAR, default='Visitor', nullable=False)
