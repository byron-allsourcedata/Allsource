from uuid import UUID

import sqlalchemy
from sqlalchemy.orm import Mapped, mapped_column

from models.premium_source_sync import PremiumSourceSync

from ..base import Base


class MetaPremiumSourceSync(Base):
    """
    Table that stores Google Ads-specific credentials and information about the sync
    """

    __tablename__ = "premium_source_syncs_meta"

    id: Mapped[UUID] = mapped_column(
        sqlalchemy.UUID, primary_key=True, nullable=False
    )
    premium_source_sync_id: Mapped[UUID] = mapped_column(
        sqlalchemy.UUID,
        sqlalchemy.ForeignKey(PremiumSourceSync.id, ondelete="CASCADE"),
        nullable=False,
    )
    customer_id: Mapped[str] = mapped_column(sqlalchemy.VARCHAR, nullable=False)
    campaign_id: Mapped[str] = mapped_column(sqlalchemy.VARCHAR, nullable=False)
    list_id: Mapped[str] = mapped_column(sqlalchemy.VARCHAR, nullable=False)
    list_name: Mapped[str] = mapped_column(sqlalchemy.VARCHAR, nullable=False)
