from sqlalchemy import Column, Integer, VARCHAR, Index, String

from .base import Base


class FiveXFiveHems(Base):
    __tablename__ = '5x5_hems'
    __table_args__ = (
        Index('5x5_hems_sha256_lc_hem_idx', 'sha256_lc_hem'),
    )

    up_id = Column(String(64), primary_key=True, nullable=False)
    sha256_lc_hem = Column(String(64), primary_key=True, nullable=False)
    md5_lc_hem = Column(String(32), nullable=True)
    sha1_lc_hem = Column(String(64), nullable=True)
