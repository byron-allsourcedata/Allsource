from .base import Base
from sqlalchemy import Column, Integer, ForeignKey


class FiveXFiveUsersLocations(Base):
    __tablename__ = '5x5_users_locations'

    five_x_five_user_id = Column(Integer, ForeignKey('5x5_users.id'), nullable=False, primary_key=True)
    location_id = Column(Integer, ForeignKey('five_x_five_locations.id'), nullable=False, primary_key=True)
