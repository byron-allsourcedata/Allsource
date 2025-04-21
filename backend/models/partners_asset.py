from sqlalchemy import Column, event, Integer, TIMESTAMP, TEXT, VARCHAR, text
from .base import Base, create_timestamps, update_timestamps


class PartnersAsset(Base):
    __tablename__ = 'partners_assets'

    id = Column(
        Integer,
        primary_key=True,
        nullable=False,
        server_default=text("nextval('partners_assets_id_seq'::regclass)")
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
    created_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text('now()')
    )
    updated_at = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text('now()')
    )


event.listen(PartnersAsset, "before_insert", create_timestamps)
event.listen(PartnersAsset, "before_update", update_timestamps)
