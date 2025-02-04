from sqlalchemy import Column, Integer, VARCHAR, ForeignKey

from .base import Base


class FiveXFiveUserInterest(Base):
    __tablename__ = '5x5_users_interests'

    id = Column(Integer, primary_key=True)
    hem = Column(VARCHAR(64), nullable=True)
    up_id = Column(VARCHAR(64), nullable=True)
    topic_id = Column(VARCHAR(16), nullable=True)
