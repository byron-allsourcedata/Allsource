from sqlalchemy import Column, Integer, VARCHAR

from .base import Base


class FiveXFiveUsersPhones(Base):
    __tablename__ = '5x5_users_phones'

    user_id = Column(Integer, nullable=True, primary_key=True)
    phone_id = Column(Integer, nullable=True, primary_key=True)
    type = Column(VARCHAR, nullable=True, primary_key=True)
