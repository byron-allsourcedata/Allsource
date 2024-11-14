from sqlalchemy import Column, Integer, VARCHAR, TIMESTAMP, Boolean, ARRAY, JSON, Index
from datetime import datetime
from models.base import Base

class ExternalAppsInstall(Base):
    __tablename__ = 'external_apps_install'

    
    id = Column(Integer, primary_key=True, autoincrement=True)
    platform = Column(VARCHAR, index=True, nullable=False)
    store_hash = Column(VARCHAR, index=True, nullable=False)
    access_token = Column(VARCHAR, nullable=False)

Index('external_apps_install_platform_idx', ExternalAppsInstall.platform, ExternalAppsInstall.store_hash)