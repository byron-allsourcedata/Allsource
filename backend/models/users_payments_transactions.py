from sqlalchemy import Column, ForeignKey, event, Integer, VARCHAR
from sqlalchemy.dialects.postgresql import BIGINT, TIMESTAMP

from .base import Base, create_timestamps, update_timestamps


class UsersPaymentsTransactions(Base):
    __tablename__ = "users_payments_transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP(precision=6))
    updated_at = Column(TIMESTAMP(precision=6))
    transaction_id = Column(VARCHAR, nullable=True, unique=True)
    status = Column(VARCHAR, nullable=True)
    amount_credits = Column(Integer, nullable=True)
    type = Column(VARCHAR, nullable=False)
    domain_id = Column(Integer, ForeignKey("users_domains.id"), nullable=True)
    five_x_five_up_id = Column(VARCHAR, nullable=False)
    stripe_request_created_at = Column(TIMESTAMP)

event.listen(UsersPaymentsTransactions, "before_insert", create_timestamps)