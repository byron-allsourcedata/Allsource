from datetime import datetime
from uuid import UUID
from sqlalchemy import (
    TIMESTAMP,
    ForeignKey,
    BigInteger,
    Uuid,
    event,
    func,
    select,
    text,
)
import sqlalchemy
from sqlalchemy.orm import Mapped, mapped_column

from models.premium_source import PremiumSource
from models.users import Users
from .base import Base, update_timestamps


class PremiumSourceTransaction(Base):
    __tablename__ = "premium_sources_transactions"
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True)
    premium_source_id: Mapped[UUID] = mapped_column(
        sqlalchemy.UUID, ForeignKey(PremiumSource.id), nullable=False
    )
    user_id: Mapped[BigInteger] = mapped_column(
        ForeignKey(Users.id, ondelete="CASCADE"), nullable=False
    )
    """
    user, that made payment
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


event.listen(PremiumSource, "before_update", update_timestamps)
