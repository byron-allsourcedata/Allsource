from sqlalchemy import Column, BigInteger, TIMESTAMP, VARCHAR, DECIMAL, ForeignKey
from .base import Base


class BobOrder(Base):
    __tablename__ = 'bob_orders'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    platform_user_id = Column(BigInteger, ForeignKey('users.id'), nullable=True)
    lead_user_id = Column(BigInteger, ForeignKey('users.id'), nullable=True)
    platform_order_id = Column(BigInteger, nullable=True)
    currency_code = Column(VARCHAR(8), nullable=True)
    total_price = Column(DECIMAL(10, 2), nullable=True)
    created_at = Column(TIMESTAMP, nullable=True)
    platform_created_at = Column(TIMESTAMP, nullable=True)
    platform = Column(VARCHAR, nullable=True)
    platfrom_email = Column(VARCHAR, nullable=True)
    domain_id = Column(BigInteger, ForeignKey('users_domains.id', ondelete='CASCADE'), nullable=True)
    last_name = Column(VARCHAR, nullable=True)
    first_name = Column(VARCHAR, nullable=True)
