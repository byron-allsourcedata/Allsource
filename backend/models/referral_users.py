from sqlalchemy import Column, Integer, VARCHAR, Index, TIMESTAMP
from .base import Base


class ReferralUser(Base):
    __tablename__ = 'referral_users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    parent_user_id = Column(Integer, nullable=False)
    discount_code_id = Column(Integer, nullable=True)
    referral_program_type = Column(VARCHAR(32), nullable=False, default='partner')
    created_at = Column(TIMESTAMP, nullable=False)
    
    __table_args__ = (
        Index('referral_users_user_id_parent_user_id_idx', 'user_id', 'parent_user_id'),
        Index('referral_users_pkey', 'id'),
    )

