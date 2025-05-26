from sqlalchemy import Column, ForeignKey, TIMESTAMP, BigInteger

from .base import Base


class LeadsUsersOrdered(Base):
    __tablename__ = 'leads_users_ordered'

    lead_user_id = Column(
        BigInteger,
        ForeignKey('leads_users.id', ondelete='CASCADE'),
        primary_key=True,
        nullable=False
    )
    ordered_at = Column(TIMESTAMP, nullable=False)
