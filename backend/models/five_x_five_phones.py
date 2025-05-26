from sqlalchemy import Column, Index, BigInteger, Sequence, String

from .base import Base


class FiveXFivePhones(Base):
    __tablename__ = '5x5_phones'
    __table_args__ = (
        Index('5x5_phones_number_idx', 'number', unique=True),
    )

    id = Column(
        BigInteger,
        Sequence('5x5_phones_id_seq'),
        primary_key=True,
        nullable=False
    )
    number = Column(String(64), nullable=True)
