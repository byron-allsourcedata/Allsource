from sqlalchemy import Column, Integer, VARCHAR
from .base import Base


class LeadUser(Base):
    __tablename__ = 'leads_users'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer)
    user_id = Column(Integer)
    status = Column(VARCHAR)
    funnel = Column(VARCHAR)
