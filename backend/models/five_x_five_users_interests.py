from sqlalchemy import Column, BigInteger, Sequence, String

from .base import Base


class FiveXFiveUserInterest(Base):
    __tablename__ = '5x5_users_interests'

    id = Column(
        BigInteger,
        Sequence('5x5_users_interests_id_seq'),
        primary_key=True,
        nullable=False
    )
    hem = Column(String(64), nullable=True)
    up_id = Column(String(64), nullable=True)
    topic_id = Column(String(16), nullable=True)
