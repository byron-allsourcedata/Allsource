from sqlalchemy import Column, Integer, VARCHAR, TEXT, Index

from .base import Base


class FiveXFiveInterest(Base):
    __tablename__ = '5x5_interests'

    id = Column(Integer, primary_key=True)
    topic_id = Column(VARCHAR(8), nullable=True)
    category = Column(VARCHAR(64), nullable=True)
    sub_category = Column(VARCHAR(64), nullable=True)
    topic = Column(VARCHAR(128), nullable=True)
    description = Column(TEXT, nullable=True)
    
    __table_args__ = (
        Index('5x5_interests_topic_id_idx', 'topic_id'),
    )
