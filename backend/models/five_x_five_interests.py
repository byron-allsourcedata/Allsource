from sqlalchemy import Column, Index, BigInteger, Sequence, String, Text

from .base import Base


class FiveXFiveInterest(Base):
    __tablename__ = '5x5_interests'
    __table_args__ = (
        Index('5x5_interests_topic_id_idx', 'topic_id', unique=True),
    )

    id = Column(
        BigInteger,
        Sequence('user_interests_id_seq'),
        primary_key=True
    )
    category = Column(String(64), nullable=True)
    sub_category = Column(String(64), nullable=True)
    topic = Column(String(128), nullable=True)
    topic_id = Column(String(16), nullable=True)
    description = Column(Text, nullable=True)
