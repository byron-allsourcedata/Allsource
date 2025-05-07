from sqlalchemy import Column, String, Float, ForeignKey, text, Index
from sqlalchemy.dialects.postgresql import UUID
from models.base import Base


class EnrichmentVoterRecord(Base):
    __tablename__ = 'enrichment_voter_record'

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=text('gen_random_uuid()')
    )
    asid = Column(
        UUID(as_uuid=True),
        ForeignKey('enrichment_users.asid', ondelete='CASCADE', onupdate='CASCADE'),
        nullable=False
    )
    party_affiliation = Column(String(20), nullable=True)
    congressional_district = Column(String(10), nullable=True)
    voting_propensity = Column(Float, nullable=True)
    
    __table_args__ = (
        Index("ix_voter_asid", asid),
    )
