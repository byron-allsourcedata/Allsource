from sqlalchemy import Column, VARCHAR, TIMESTAMP, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from uuid import uuid4
from models.base import Base


class EnrichmentPostal(Base):
    __tablename__ = 'enrichment_postals'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, nullable=False)
    asid = Column(UUID(as_uuid=True), ForeignKey('enrichment_users.asid', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    home_address_line1 = Column(VARCHAR(256), nullable=True)
    home_address_line2 = Column(VARCHAR(256), nullable=True)
    home_city = Column(VARCHAR(128), nullable=True)
    home_state = Column(VARCHAR(2), nullable=True)
    home_postal_code = Column(VARCHAR(16), nullable=True)
    home_country = Column(VARCHAR(3), nullable=True)
    home_address_last_seen = Column(TIMESTAMP, nullable=True)
    home_address_validation_status = Column(VARCHAR(1), nullable=True)
    business_address_line1 = Column(VARCHAR(256), nullable=True)
    business_address_line2 = Column(VARCHAR(256), nullable=True)
    business_city = Column(VARCHAR(256), nullable=True)
    business_state = Column(VARCHAR(256), nullable=True)
    business_postal_code = Column(VARCHAR(10), nullable=True)
    business_country = Column(VARCHAR(256), nullable=True)
    business_address_last_seen = Column(TIMESTAMP, nullable=True)
    business_address_validation_status = Column(VARCHAR(8), nullable=True)
    address_source = Column(VARCHAR(4), nullable=True)
    raw_url_date = Column(TIMESTAMP, nullable=True)
    raw_last_updated = Column(TIMESTAMP, nullable=True)
    created_date = Column(TIMESTAMP, nullable=False)
       
    __table_args__ = (
        Index("enrichment_postals_asid_idx", asid),
    )
    
    enrichment_user = relationship(
        "EnrichmentUser",
        back_populates='postal',
        foreign_keys=[asid],
        uselist=False,
        lazy="select"
    )
