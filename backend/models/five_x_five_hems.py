from sqlalchemy import Column, Integer, TEXT
from sqlalchemy.dialects.postgresql import VARCHAR

from .base import Base


class FiveXFiveHems(Base):
    __tablename__ = '5x5_hems'

    id = Column(Integer, primary_key=True)
    up_id = Column(VARCHAR)
    sha256_lc_hem = Column(VARCHAR)
    md5_lc_hem = Column(VARCHAR)
    sha1_lc_hem = Column(VARCHAR)
