from datetime import datetime
from uuid import UUID
from sqlalchemy import TIMESTAMP, VARCHAR, Uuid, event, func, select, text
from sqlalchemy.orm import Mapped, mapped_column

from models.users import Users
from .base import Base, update_timestamps


class PremiumSource(Base):
    __tablename__ = "premium_sources_transactions"
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True)
    # premium_source
    user_id: Mapped[int] = mapped_column(nullable=False)
    """
    user, for which this source is uploaded
    """
    s3_url: Mapped[str] = mapped_column(nullable=True)
    """
    s3_url for this source's .csv file
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


def count_by_user():
    """
    Users.id
    count(PremiumSource)
    """
    return (
        select(
            Users.id.label("id"), func.count(PremiumSource.id).label("count")
        )
        .select_from(Users)
        .outerjoin(PremiumSource, PremiumSource.user_id == Users.id)
        .group_by(Users.id)
    )
