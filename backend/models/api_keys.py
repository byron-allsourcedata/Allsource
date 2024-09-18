from sqlalchemy import Column, Integer,VARCHAR, TIMESTAMP, event, ForeignKey

from .base import Base

class ApiKeys(Base):
    __tablename__ = 'api_keys'

    id = Column(Integer, primary_key=True)
    api_key = Column(VARCHAR, nullable=False)
    api_id = Column(VARCHAR, nullable=False)
    name = Column(VARCHAR, nullable=False)
    description = Column(VARCHAR, nullable=False)
    last_used_at = Column(TIMESTAMP, nullable=False)
    created_date = Column(TIMESTAMP, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
