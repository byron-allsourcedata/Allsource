from sqlalchemy import Column, Integer, TIMESTAMP
from sqlalchemy.dialects.postgresql import NUMERIC, VARCHAR
from .base import Base


class ReferralPayouts(Base):
    __tablename__ = 'referral_payouts'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    parent_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    reward_amount = Column(NUMERIC(18, 2), nullable=False)
    reward_type = Column(VARCHAR(128), nullable=False)
    created_at = Column(TIMESTAMP, nullable=False)