from datetime import datetime
from uuid import UUID
from sqlalchemy import (
    TIMESTAMP,
    VARCHAR,
    BigInteger,
    ForeignKey,
    Uuid,
    event,
    func,
    text,
)
import sqlalchemy
from sqlalchemy.orm import Mapped, mapped_column

from models.premium_sources_transactions import PremiumSourceTransaction
from .base import Base, update_timestamps


class PremiumSourceStripeDeduction(Base):
    """
    Represents the stripe deduction for a premium source.
    Its a part of transaction
    """

    __tablename__ = "premium_sources_deduction_stripe"
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True)
    transaction_id: Mapped[UUID] = mapped_column(
        sqlalchemy.UUID, ForeignKey(PremiumSourceTransaction.id)
    )

    payment_method_id: Mapped[str] = mapped_column(VARCHAR(32), nullable=False)
    amount: Mapped[int] = mapped_column(nullable=False)
    """
    Charged amount in cents
    """
    funds_snapshot: Mapped[int | None] = mapped_column(
        BigInteger, nullable=True
    )
    """
    How much funds user had _before_ this transaction

    May be nullable only in case of unlimited funds balance of the client

    This information is stored in case of integrity issues
    """
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        default=func.now(),
        server_default=text("now()"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP,
        nullable=False,
        default=func.now(),
        server_default=text("now()"),
    )


event.listen(PremiumSourceStripeDeduction, "before_update", update_timestamps)
