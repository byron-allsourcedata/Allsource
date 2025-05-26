from datetime import datetime, timezone

from sqlalchemy import Column, VARCHAR, Index, TIMESTAMP, TEXT, ForeignKey, BigInteger, Sequence

from .base import Base


class LeadCompany(Base):
    __tablename__ = 'leads_companies'
    __table_args__ = (
        Index('leads_companies_alias_idx', 'alias', unique=True),
        Index('leads_companies_primary_industry_idx', 'primary_industry'),
    )

    id = Column(
        BigInteger,
        Sequence('leads_companies_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    name = Column(
        VARCHAR(256),
        nullable=False
    )
    alias = Column(
        VARCHAR(256),
        nullable=False
    )
    domain = Column(
        VARCHAR(256),
        nullable=True
    )
    phone = Column(
        VARCHAR(256),
        nullable=True
    )
    sic = Column(
        VARCHAR(256),
        nullable=True
    )
    address = Column(
        VARCHAR(256),
        nullable=True
    )
    five_x_five_location_id = Column(
        BigInteger,
        ForeignKey('5x5_locations.id'),
        nullable=True
    )
    zip = Column(
        VARCHAR(64),
        nullable=True
    )
    linkedin_url = Column(
        VARCHAR(256),
        nullable=True
    )
    revenue = Column(
        VARCHAR(256),
        nullable=True
    )
    employee_count = Column(
        VARCHAR(256),
        nullable=True
    )
    last_updated = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    description = Column(
        TEXT,
        nullable=True
    )
    primary_industry = Column(
        VARCHAR(256),
        nullable=True
    )
