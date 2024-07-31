from sqlalchemy import Column, Integer

from .base import Base


class AudienceLeads(Base):
    __tablename__ = 'audience_leads'

    id = Column(Integer, primary_key=True)
    audience_id = Column(Integer)
    lead_id = Column(Integer)
