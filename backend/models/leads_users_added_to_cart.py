from sqlalchemy import Column, Integer, VARCHAR, ForeignKey, TIMESTAMP, BigInteger

from .base import Base


class LeadsUsersAddedToCart(Base):
    __tablename__ = 'leads_users_added_to_cart'

    lead_user_id = Column(
        BigInteger,
        ForeignKey('leads_users.id', ondelete='CASCADE'),
        primary_key=True,
        nullable=False
    )
    added_at = Column(
        TIMESTAMP,
        nullable=False
    )
