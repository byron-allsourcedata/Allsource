from sqlalchemy import Column, Integer, TEXT
from sqlalchemy.dialects.postgresql import VARCHAR

from .base import Base


class Locations(Base):
    __tablename__ = 'locations'

    id = Column(Integer, primary_key=True)
    country = Column(VARCHAR)
    city = Column(VARCHAR)
    state = Column(VARCHAR)
