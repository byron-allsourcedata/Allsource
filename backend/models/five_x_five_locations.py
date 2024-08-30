from sqlalchemy import Column, Integer, VARCHAR

from .base import Base


class FiveXFiveLocations(Base):
    __tablename__ = 'five_x_five_locations'

    id = Column(Integer, primary_key=True, nullable=False)
    country = Column(VARCHAR, nullable=True)
    city = Column(VARCHAR, nullable=True)
    state = Column(VARCHAR, nullable=True)
