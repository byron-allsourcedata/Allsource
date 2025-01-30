from sqlalchemy import Column, Integer, VARCHAR, ForeignKey

from .base import Base


class FiveXFiveUserInterest(Base):
    __tablename__ = '5x5_users_interests'

    id = Column(Integer, primary_key=True)
    interest_id = Column(Integer, ForeignKey('5x5_interests.id'), nullable=False, primary_key=True)
    five_x_five_user_id = Column(Integer, ForeignKey('5x5_users.id'), nullable=False, primary_key=True)
