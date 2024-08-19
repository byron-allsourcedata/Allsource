from sqlalchemy import Column, Integer

from .base import Base


class AudienceLeads(Base):
    __tablename__ = 'audience_leads'

    id = Column(Integer, primary_key=True)
    audience_id = Column(Integer, nullable=False)
    lead_id = Column(Integer, nullable=False)
