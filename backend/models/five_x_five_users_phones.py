from sqlalchemy import Column, Integer, VARCHAR, BigInteger, ForeignKey, String

from .base import Base


class FiveXFiveUsersPhones(Base):
    __tablename__ = '5x5_users_phones'

    user_id = Column(
        BigInteger,
        ForeignKey('5x5_users.id', ondelete='CASCADE'),
        primary_key=True,
        nullable=False
    )
    phone_id = Column(
        BigInteger,
        ForeignKey('5x5_phones.id', ondelete='CASCADE'),
        primary_key=True,
        nullable=False
    )
    type = Column(
        String(64),
        primary_key=True,
        nullable=False
    )
