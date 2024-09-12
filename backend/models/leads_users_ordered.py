from sqlalchemy import Column, Integer, VARCHAR, ForeignKey, TIMESTAMP

from .base import Base


class LeadsUsersOrdered(Base):
    __tablename__ = 'leads_users_ordered'

    lead_user_id = Column(Integer, ForeignKey('leads_users.id'), nullable=False, primary_key=True)
    ordered_at = Column(TIMESTAMP, nullable=False)
