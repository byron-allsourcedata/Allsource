from sqlalchemy import Column, Integer, JSON

from .base import Base


class Kajabi(Base):
    __tablename__ = 'kajabi'

    id = Column(Integer, primary_key=True)
    text = Column(JSON, nullable=True)
