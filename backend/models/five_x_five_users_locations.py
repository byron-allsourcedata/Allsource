from .base import Base
from sqlalchemy import Column, Integer, ForeignKey


class FiveXFiveUsersLocations(Base):
    __tablename__ = '5x5_users_locations'

    id = Column(Integer, primary_key=True, nullable=False)
    five_x_five_user_id = Column(Integer, ForeignKey('5x5_users.id'), nullable=False)
    location_id = Column(Integer, ForeignKey('five_x_five_locations.id'), nullable=False)
