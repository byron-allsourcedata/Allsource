from sqlalchemy import Column, Integer, JSON, BigInteger, text, Sequence

from .base import Base


class Kajabi(Base):
    __tablename__ = 'kajabi'

    id = Column(
        BigInteger,
        Sequence('kajabi_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    text = Column(
        JSON,
        nullable=True
    )
