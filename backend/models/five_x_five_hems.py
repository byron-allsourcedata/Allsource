from sqlalchemy import Column, Integer, VARCHAR

from .base import Base


class FiveXFiveHems(Base):
    __tablename__ = '5x5_hems'

    up_id = Column(VARCHAR, nullable=False, primary_key=True)
    sha256_lc_hem = Column(VARCHAR, nullable=False, primary_key=True)
    md5_lc_hem = Column(VARCHAR, nullable=True)
    sha1_lc_hem = Column(VARCHAR, nullable=True)
