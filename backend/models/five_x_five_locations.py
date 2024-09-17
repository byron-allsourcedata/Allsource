from sqlalchemy import Column, Integer, VARCHAR

from .base import Base


class FiveXFiveLocations(Base):
    __tablename__ = '5x5_locations'

    id = Column(Integer, primary_key=True, nullable=False)
    country = Column(VARCHAR, nullable=True)
    city = Column(VARCHAR, nullable=True)
    state_id = Column(VARCHAR, nullable=True)