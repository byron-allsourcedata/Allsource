from sqlalchemy import Column, ForeignKey, event, Integer, VARCHAR
from sqlalchemy.dialects.postgresql import BIGINT, TIMESTAMP

from .base import Base, create_timestamps, update_timestamps


class UsersPaymentsTransactions(Base):
    __tablename__ = "users_payments_transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP(precision=6))
    transaction_id = Column(VARCHAR, nullable=True)
    status = Column(VARCHAR, nullable=True)
    amount_credits = Column(Integer, nullable=True)
    type = Column(VARCHAR, nullable=False)
    lead_id = Column(Integer, ForeignKey("leads_users.id"), nullable=True)
    five_x_five_up_id = Column(VARCHAR, nullable=False)