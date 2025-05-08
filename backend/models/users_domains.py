from datetime import datetime

from sqlalchemy import Column, Integer, BOOLEAN, VARCHAR, TIMESTAMP, Index, Boolean, ForeignKey, BigInteger, \
    UniqueConstraint, text

from .base import Base


class UserDomains(Base):
    __tablename__ = 'users_domains'
    __table_args__ = (
        Index('users_domains_data_provider_id_idx', 'data_provider_id', unique=True),
        Index('users_domains_is_enable_idx', 'is_enable'),
        UniqueConstraint('api_key', name='users_domains_unique'),
    )

    id = Column(BigInteger, primary_key=True, nullable=False,
                server_default=text("nextval('users_domains_id_seq'::regclass)"))
    user_id = Column(BigInteger, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    domain = Column(VARCHAR, nullable=False)
    data_provider_id = Column(VARCHAR(64), nullable=True)
    is_pixel_installed = Column(Boolean, nullable=True, server_default=text('false'))
    is_enable = Column(Boolean, nullable=False, server_default=text('true'))
    created_at = Column(TIMESTAMP, nullable=False, server_default=text('now()'))
    api_key = Column(VARCHAR, nullable=True)
    viewed_product_part_url = Column(VARCHAR, nullable=True)
