from sqlalchemy import Column, Integer, VARCHAR, Boolean
from .base import Base


class ReferralPayouts(Base):
    __tablename__ = 'referral_payouts'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(VARCHAR(128), nullable=False)
    discount_amount = Column(Integer, nullable=True)
    is_percentage = Column(Boolean, nullable=True)
    coupon = Column(VARCHAR(128), nullable=False)
