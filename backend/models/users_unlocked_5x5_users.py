from sqlalchemy import Column, ForeignKey, event, Integer, VARCHAR, Index, DECIMAL, BigInteger, text, Sequence
from sqlalchemy.dialects.postgresql import TIMESTAMP

from .base import Base, create_timestamps


class UsersUnlockedFiveXFiveUser(Base):
    __tablename__ = 'users_unlocked_5x5_users'
    __table_args__ = (
        Index('users_payments_transactions_transaction_id_idx', 'transaction_id', unique=True),
        Index('users_unlocked_5x5_users_domain_id_five_x_five_up_id_idx', 'domain_id', 'five_x_five_up_id'),
        Index('users_unlocked_5x5_users_up_id_idx', 'five_x_five_up_id'),
    )

    id = Column(
        BigInteger,
        Sequence('users_payments_transactions_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    user_id = Column(
        BigInteger,
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=True
    )
    created_at = Column(
        TIMESTAMP(precision=6),
        nullable=True
    )
    updated_at = Column(
        TIMESTAMP(precision=6),
        nullable=True
    )
    transaction_id = Column(
        VARCHAR,
        nullable=True
    )
    amount_credits = Column(
        DECIMAL(10, 2),
        nullable=True
    )
    domain_id = Column(
        BigInteger,
        ForeignKey('users_domains.id', ondelete='CASCADE'),
        nullable=True
    )
    five_x_five_up_id = Column(
        VARCHAR,
        nullable=False
    )
    stripe_request_created_at = Column(
        TIMESTAMP,
        nullable=True
    )


event.listen(UsersUnlockedFiveXFiveUser, "before_insert", create_timestamps)
