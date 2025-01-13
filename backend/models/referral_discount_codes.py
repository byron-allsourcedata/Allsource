from sqlalchemy import Column, Integer, VARCHAR, Boolean
from .base import Base


class ReferralDiscountCode(Base):
    __tablename__ = 'referral_discount_codes'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(VARCHAR(128), nullable=False)
    discount_amount = Column(Integer, nullable=True)
    is_percentage = Column(Boolean, nullable=True)
    coupon = Column(VARCHAR(128), nullable=False)
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "discount_amount": self.discount_amount,
            "is_percentage": self.is_percentage,
            "coupon": self.coupon
        }
