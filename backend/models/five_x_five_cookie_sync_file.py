from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, Sequence, Index, UniqueConstraint
from .base import Base


class FiveXFiveCookieSyncFile(Base):
    __tablename__ = '5x5_cookie_sync_files'
    __table_args__ = (
        Index(
            '5x5_cookie_sync_files_event_date_idx',
            'event_date'
        ),
        UniqueConstraint(
            'file_name',
            'up_id',
            'event_date',
            'sha256_lower_case',
            name='5x5_cookie_sync_files_file_name_up_id_event_date_sha256_lower_c'
        ),
    )

    id = Column(
        Integer,
        Sequence('5x5_cookie_sync_file_id_seq'),
        primary_key=True
    )
    trovo_id = Column(String(128), nullable=True)
    partner_id = Column(String(128), nullable=True)
    partner_uid = Column(Text, nullable=True)
    sha256_lower_case = Column(String(64), nullable=True)
    ip = Column(String(64), nullable=True)
    json_headers = Column(Text, nullable=True)
    event_date = Column(TIMESTAMP, nullable=True)
    up_id = Column(String(64), nullable=True)
    file_name = Column(String(256), nullable=True)
