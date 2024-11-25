from models.base import Base
from sqlalchemy import VARCHAR, Integer, Column, JSON, Boolean, TIMESTAMP
from datetime import datetime

class SuppressedContact(Base):

    __tablename__ = 'suppressed_contacts'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    five_x_five_user_id = Column(Integer, nullable=False)
    domain_id = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.now)
    date_requested_at = Column(TIMESTAMP, default=datetime.now)