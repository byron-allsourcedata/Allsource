from datetime import datetime
from uuid import UUID
import sqlalchemy
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base
from .users import Users


class WhitelabelSettings(Base):
    __tablename__ = "whitelabel_settings"

    id: Mapped[UUID] = mapped_column(
        sqlalchemy.UUID(as_uuid=True),
        primary_key=True,
        server_default=sqlalchemy.text("gen_random_uuid()"),
    )
    user_id: Mapped[int] = mapped_column(
        sqlalchemy.Integer, sqlalchemy.ForeignKey(Users.id), nullable=False
    )
    brand_name: Mapped[str | None] = mapped_column(
        sqlalchemy.VARCHAR, nullable=True
    )
    brand_logo_url: Mapped[str | None] = mapped_column(
        sqlalchemy.VARCHAR, nullable=True
    )
    brand_icon_url: Mapped[str | None] = mapped_column(
        sqlalchemy.VARCHAR, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        sqlalchemy.TIMESTAMP, nullable=False, default=datetime.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        sqlalchemy.TIMESTAMP, nullable=False, default=datetime.now()
    )
