from sqlalchemy import Column, Integer, BigInteger, Sequence, ForeignKey

from .base import Base


class AudienceLeads(Base):
    __tablename__ = 'audience_leads'

    id = Column(
        BigInteger,
        Sequence('audience_leads_id_seq'),
        primary_key=True,
        nullable=False
    )
    audience_id = Column(
        BigInteger,
        ForeignKey('audience.id', ondelete='CASCADE'),
        nullable=False
    )
    lead_id = Column(
        BigInteger,
        ForeignKey('5x5_users.id', ondelete='CASCADE'),
        nullable=False
    )
