from sqlalchemy import Column, Integer, VARCHAR

from .base import Base


class FiveXFiveSurnames(Base):
    __tablename__ = '5x5_surname'

    id = Column(Integer, primary_key=True)
    name = Column(VARCHAR, nullable=True)
