from sqlalchemy import Column, Integer, VARCHAR, TEXT, TIMESTAMP

from .base import Base


class FiveXFiveCookieSyncFile(Base):
    __tablename__ = '5x5_cookie_sync_files'

    id = Column(Integer, primary_key=True)
    trovo_id = Column(VARCHAR(128), nullable=False)
    partner_id = Column(VARCHAR(128), nullable=False)
    partner_uid = Column(TEXT, nullable=False)
    sha256_lower_case = Column(VARCHAR(64), nullable=False)
    ip = Column(VARCHAR(64), nullable=False)
    json_headers = Column(TEXT, nullable=False)
    event_date = Column(TIMESTAMP, nullable=False)
    up_id = Column(VARCHAR(64), nullable=False)
    file_name = Column(VARCHAR(256), nullable=False)
