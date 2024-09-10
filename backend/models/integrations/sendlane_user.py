from sqlalchemy import Column, Integer, VARCHAR, TIMESTAMP
from datetime import datetime
from models.base import Base

class SendlaneUser(Base):

    __tablename__= 'integration_sendlane_user'
    id = Column(Integer, primary_key=True, autoincrement=True)
    sendlane_user_id = Column(Integer)
    email = Column(VARCHAR)
    