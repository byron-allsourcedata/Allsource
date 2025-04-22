from sqlalchemy import Column, Integer, JSON, BigInteger, text

from .base import Base


class Kajabi(Base):
    __tablename__ = 'kajabi'

    id = Column(
        BigInteger,
        primary_key=True,
        nullable=False,
        server_default=text("nextval('kajabi_id_seq'::regclass)")
    )
    text = Column(
        JSON,
        nullable=True
    )
