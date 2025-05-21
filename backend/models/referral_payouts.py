from sqlalchemy import Column, Integer, TIMESTAMP, TEXT, text, BigInteger, ForeignKey, Sequence
from sqlalchemy.dialects.postgresql import NUMERIC, VARCHAR
from enums import PayoutsStatus, ConfirmationStatus
from .base import Base


class ReferralPayouts(Base):
    __tablename__ = 'referral_payouts'

    id = Column(
        BigInteger,
        Sequence('referral_payouts_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    parent_id = Column(
        BigInteger,
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False
    )
    user_id = Column(
        BigInteger,
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False
    )
    reward_amount = Column(
        NUMERIC(18, 2),
        nullable=False
    )
    reward_type = Column(
        VARCHAR(128),
        nullable=False
    )
    created_at = Column(
        TIMESTAMP,
        nullable=False
    )
    status = Column(
        VARCHAR(16),
        nullable=False,
        server_default=text("'pending'::character varying")
    )
    confirmation_status = Column(
        VARCHAR(16),
        nullable=False,
        server_default=text("'pending'::character varying")
    )
    plan_amount = Column(
        NUMERIC(18, 2),
        nullable=False
    )
    paid_at = Column(
        TIMESTAMP,
        nullable=True
    )
    comment = Column(
        TEXT,
        nullable=True
    )
