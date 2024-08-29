from sqlalchemy import Column, Integer, VARCHAR

from .base import Base


class FiveXFiveNames(Base):
    __tablename__ = '5x5_names'

    id = Column(Integer, primary_key=True)
    name = Column(VARCHAR, nullable=True)
