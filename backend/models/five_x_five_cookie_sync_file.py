from sqlalchemy import Column, Integer, VARCHAR, TEXT, TIMESTAMP

from .base import Base


class FiveXFiveCookieSyncFile(Base):
    __tablename__ = '5x5_cookie_sync_file'

    id = Column(Integer, primary_key=True)
    trovo_id = Column(VARCHAR, nullable=False)
    partner_id = Column(VARCHAR, nullable=False)
    partner_uid = Column(VARCHAR, nullable=False)
    sha256_lower_case = Column(VARCHAR, nullable=False)
    ip = Column(VARCHAR, nullable=False)
    json_headers = Column(TEXT, nullable=False)
    event_date = Column(TIMESTAMP, nullable=False)
    up_id = Column(VARCHAR, nullable=False)
