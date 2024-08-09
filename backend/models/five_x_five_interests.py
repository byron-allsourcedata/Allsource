from sqlalchemy import Column, Integer, VARCHAR

from .base import Base


class FiveXFiveInterests(Base):
    __tablename__ = '5x5_interests'

    id = Column(Integer, primary_key=True)
    category = Column(VARCHAR, nullable=True)
    sub_category = Column(Integer, nullable=True)
    topic = Column(VARCHAR, nullable=True)
