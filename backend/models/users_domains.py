from sqlalchemy import Column, Integer, BOOLEAN, VARCHAR, TIMESTAMP

from .base import Base


class UserDomains(Base):
    __tablename__ = 'users_domains'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    domain = Column(VARCHAR, nullable=False)
    data_provider_id = Column(VARCHAR(64))
    is_pixel_installed = Column(BOOLEAN, default=False)
    enable = Column(BOOLEAN, default=True)
    created_at = Column(TIMESTAMP, nullable=False)
