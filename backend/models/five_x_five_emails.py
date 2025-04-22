from sqlalchemy import Column, BigInteger, String, Sequence, Index
from .base import Base


class FiveXFiveEmails(Base):
    __tablename__ = '5x5_emails'
    __table_args__ = (
        Index('5x5_emails_email_idx', 'email', unique=True),
        Index(
            'idx_5x5_emails_host',
            'email_host',
            postgresql_ops={'email_host': 'varchar_pattern_ops'}
        ),
        Index(
            'idx_5x5_emails_name',
            'email',
            postgresql_ops={'email': 'varchar_pattern_ops'}
        ),
    )

    id = Column(
        BigInteger,
        Sequence('5x5_emails_id_seq'),
        primary_key=True
    )
    email = Column(String, nullable=False)
    email_host = Column(String, nullable=False)
