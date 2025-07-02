from sqlalchemy import Column, DateTime, String, func
from .base import Base
from datetime import datetime, timezone


class OptOutBlackList(Base):
    __tablename__ = "opt_out_black_list"

    email = Column(String, primary_key=True, index=True)
    ip = Column(String, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.timezone("UTC", func.now()),
        nullable=False,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
    )
