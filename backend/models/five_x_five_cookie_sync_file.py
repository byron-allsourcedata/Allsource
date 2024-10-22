from sqlalchemy import Column, Integer, VARCHAR, TEXT, TIMESTAMP

from .base import Base


class FiveXFiveCookieSyncFile(Base):
    __tablename__ = '5x5_cookie_sync_files'

    id = Column(Integer, primary_key=True)
    trovo_id = Column(VARCHAR(128), nullable=True)
    partner_id = Column(VARCHAR(128), nullable=True)
    partner_uid = Column(TEXT, nullable=True)
    sha256_lower_case = Column(VARCHAR(64), nullable=True)
    ip = Column(VARCHAR(64), nullable=True)
    json_headers = Column(TEXT, nullable=True)
    event_date = Column(TIMESTAMP, nullable=True)
    up_id = Column(VARCHAR(64), nullable=True)
    file_name = Column(VARCHAR(256), nullable=False)
