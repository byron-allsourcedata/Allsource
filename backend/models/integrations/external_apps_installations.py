from sqlalchemy import Column, Integer, VARCHAR, TIMESTAMP, Boolean, ARRAY, JSON, Index, BigInteger, text
from datetime import datetime
from models.base import Base


class ExternalAppsInstall(Base):
    __tablename__ = 'external_apps_installations'
    __table_args__ = (
        Index('external_apps_install_platform_idx', 'platform', 'store_hash'),
        Index('external_apps_installations_store_hash_idx', 'store_hash', unique=True),
    )

    id = Column(
        BigInteger,
        primary_key=True,
        nullable=False,
        server_default=text("nextval('external_apps_install_id_seq'::regclass)")
    )
    platform = Column(VARCHAR, nullable=False)
    store_hash = Column(VARCHAR, nullable=True)
    access_token = Column(VARCHAR, nullable=False)
    domain_url = Column(VARCHAR, nullable=True)
