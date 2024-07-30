from .base import Base
from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship


class LeadsLocations(Base):
    __tablename__ = 'leads_locations'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads.id'))
    location_id = Column(Integer, ForeignKey('locations.id'))
