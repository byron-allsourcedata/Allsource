from sqlalchemy import Column, Integer, VARCHAR, TIMESTAMP, event, ForeignKey, BigInteger, String, Sequence

from .base import Base


class ApiKeys(Base):
    __tablename__ = 'api_keys'

    id = Column(
        BigInteger,
        Sequence('api_keys_id_seq'),
        primary_key=True,
        nullable=False
    )
    api_key = Column(String(256), nullable=True)
    api_id = Column(String(256), nullable=True)
    name = Column(String(256), nullable=True)
    description = Column(String(256), nullable=True)
    last_used_at = Column(TIMESTAMP, nullable=True)
    created_date = Column(TIMESTAMP, nullable=True)
    user_id = Column(
        BigInteger,
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=True
    )
