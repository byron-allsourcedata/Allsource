from models.base import Base
from sqlalchemy import VARCHAR, Integer, Column, JSON, Boolean, TIMESTAMP
from datetime import datetime

class LeadsSupperssion(Base):

    __tablename__ = 'leads_suppression'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_service = Column(VARCHAR)
    email = Column(VARCHAR)
    phone_number = Column(VARCHAR)
    domain_id = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.now)
    integrations_id = Column(Integer, nullable=False)
    