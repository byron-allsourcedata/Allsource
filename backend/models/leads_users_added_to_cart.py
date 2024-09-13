from sqlalchemy import Column, Integer, VARCHAR, ForeignKey, TIMESTAMP

from .base import Base


class LeadsUsersAddedToCart(Base):
    __tablename__ = 'leads_users_added_to_cart'

    lead_user_id = Column(Integer, ForeignKey('leads_users.id'), nullable=False, primary_key=True)
    added_at = Column(TIMESTAMP, nullable=False)
