from .base import Base
from sqlalchemy import Column, Integer, ForeignKey


class LeadsLocations(Base):
    __tablename__ = 'leads_locations'

    id = Column(Integer, primary_key=True, nullable=False)
    lead_id = Column(Integer, ForeignKey('leads.id'), nullable=False)
    location_id = Column(Integer, ForeignKey('locations.id'), nullable=False)
