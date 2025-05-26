from sqlalchemy import Column, ForeignKey, BigInteger

from .base import Base


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
