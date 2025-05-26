from datetime import datetime, timezone

from sqlalchemy import Column, event, Integer, TIMESTAMP, TEXT, VARCHAR, text, Sequence
from .base import Base, update_timestamps


class PartnersAsset(Base):
    __tablename__ = 'partners_assets'

    id = Column(
        Integer,
        Sequence('partners_assets_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    title = Column(
        VARCHAR(32),
        nullable=False
    )
    type = Column(
        VARCHAR(16),
        nullable=False
    )
    file_url = Column(
        TEXT,
        nullable=False
    )
    preview_url = Column(
        TEXT,
        nullable=True
    )
    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

event.listen(PartnersAsset, "before_update", update_timestamps)
