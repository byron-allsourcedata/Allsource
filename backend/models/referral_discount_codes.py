from sqlalchemy import Column, Integer, VARCHAR, Boolean, text, BigInteger
from .base import Base


class ReferralDiscountCode(Base):
    __tablename__ = 'referral_discount_codes'

    id = Column(
        BigInteger,
        primary_key=True,
        nullable=False,
        server_default=text("nextval('referral_discount_code_id_seq'::regclass)")
    )
    name = Column(
        VARCHAR(128),
        nullable=True
    )
    discount_amount = Column(
        Integer,
        nullable=True
    )
    is_percentage = Column(
        Boolean,
        nullable=False,
        server_default=text('false')
    )
    coupon = Column(
        VARCHAR(128),
        nullable=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "discount_amount": self.discount_amount,
            "is_percentage": self.is_percentage,
            "coupon": self.coupon
        }
