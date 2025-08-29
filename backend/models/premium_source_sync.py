from datetime import datetime
from uuid import UUID
import sqlalchemy
from sqlalchemy import ForeignKey, event
from sqlalchemy.orm import Mapped, mapped_column

from models.integrations.users_domains_integrations import UserIntegration
from models.premium_source import PremiumSource
from .base import Base, update_timestamps


class PremiumSourceSync(Base):
    __tablename__ = "premium_source_sync"

    id: Mapped[UUID] = mapped_column(sqlalchemy.UUID, primary_key=True, nullable=False)
    premium_source_id: Mapped[UUID] = mapped_column(
        sqlalchemy.UUID, sqlalchemy.ForeignKey(PremiumSource.id), nullable=False
    )
    user_integration_id: Mapped[int] = mapped_column(
        ForeignKey(UserIntegration.id), nullable=False
    )
    status: Mapped[str] = mapped_column(sqlalchemy.VARCHAR, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        sqlalchemy.TIMESTAMP, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        sqlalchemy.TIMESTAMP, nullable=False
    )


event.listen(PremiumSource, "before_update", update_timestamps)
