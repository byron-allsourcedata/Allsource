from sqlalchemy import Column, Integer
from sqlalchemy.dialects.postgresql import VARCHAR

from .base import Base


class FiveXFiveInterests(Base):
    __tablename__ = '5x5_interests'

    id = Column(Integer, primary_key=True)
    category = Column(VARCHAR)
    sub_category = Column(Integer)
    topic = Column(VARCHAR)
