from sqlalchemy import Column, Integer, VARCHAR

from .base import Base


class FiveXFivePhones(Base):
    __tablename__ = '5x5_phones'

    id = Column(Integer, primary_key=True)
    number = Column(VARCHAR, nullable=True)
