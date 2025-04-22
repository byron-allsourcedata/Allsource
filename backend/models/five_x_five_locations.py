from sqlalchemy import Column, Integer, VARCHAR, Index, BigInteger, Sequence, String, ForeignKey

from .base import Base


class FiveXFiveLocations(Base):
    __tablename__ = '5x5_locations'
    __table_args__ = (
        Index('locations_pkey', 'id', unique=True),
    )

    id = Column(
        BigInteger,
        Sequence('locations_id_seq'),
        primary_key=True,
        nullable=False
    )
    country = Column(String(64), nullable=True)
    city = Column(String(64), nullable=True)
    state_id = Column(
        BigInteger,
        ForeignKey('states.id', ondelete='CASCADE'),
        nullable=True
    )
