from sqlalchemy import Column, Integer, VARCHAR

from .base import Base


class FiveXFiveHems(Base):
    __tablename__ = '5x5_hems'

    id = Column(Integer, primary_key=True)
    up_id = Column(VARCHAR, nullable=True)
    sha256_lc_hem = Column(VARCHAR, nullable=True)
    md5_lc_hem = Column(VARCHAR, nullable=True)
    sha1_lc_hem = Column(VARCHAR, nullable=True)
