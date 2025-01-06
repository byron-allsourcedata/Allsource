from datetime import datetime

from sqlalchemy import Column, Integer, BOOLEAN, VARCHAR, TIMESTAMP, Index

from .base import Base


class UserDomains(Base):
    __tablename__ = 'users_domains'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    domain = Column(VARCHAR, nullable=False)
    data_provider_id = Column(VARCHAR(64))
    is_pixel_installed = Column(BOOLEAN, default=False)
    is_enable = Column(BOOLEAN, default=True, nullable=False)
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    api_key = Column(VARCHAR, unique=True, nullable=True)
    
    __table_args__ = (
        Index('users_domains_is_enable_idx', 'is_enable'),
    )
