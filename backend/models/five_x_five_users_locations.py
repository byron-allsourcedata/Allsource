from .base import Base
from sqlalchemy import Column, Integer, ForeignKey, BigInteger


class FiveXFiveUsersLocations(Base):
    __tablename__ = '5x5_users_locations'

    five_x_five_user_id = Column(
        BigInteger,
        ForeignKey('5x5_users.id', ondelete='CASCADE'),
        primary_key=True,
        nullable=False
    )
    location_id = Column(
        BigInteger,
        ForeignKey('5x5_locations.id'),
        primary_key=True,
        nullable=False
    )
