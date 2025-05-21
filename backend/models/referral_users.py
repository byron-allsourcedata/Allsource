from sqlalchemy import Column, Integer, VARCHAR, Index, TIMESTAMP, BigInteger, text, ForeignKey, Sequence
from .base import Base


class ReferralUser(Base):
    __tablename__ = 'referral_users'
    __table_args__ = (
        Index('referral_users_user_id_parent_user_id_idx', 'user_id', 'parent_user_id'),
    )

    id = Column(
        BigInteger,
        Sequence('referral_users_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    user_id = Column(
        BigInteger,
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False
    )
    parent_user_id = Column(
        BigInteger,
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False
    )
    discount_code_id = Column(
        BigInteger,
        ForeignKey('referral_discount_codes.id', ondelete='CASCADE'),
        nullable=True
    )
    referral_program_type = Column(
        VARCHAR(32),
        nullable=False,
        server_default=text("'partner'::character varying")
    )
    created_at = Column(
        TIMESTAMP,
        nullable=False
    )
