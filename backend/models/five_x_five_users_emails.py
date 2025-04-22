from sqlalchemy import Column, Integer, VARCHAR, Index, BigInteger, ForeignKey, String

from .base import Base


class FiveXFiveUsersEmails(Base):
    __tablename__ = '5x5_users_emails'
    __table_args__ = (
        Index('5x5_users_emails_type_idx', 'type'),
        Index('5x5_users_emails_user_id_type_idx', 'user_id', 'type'),
    )

    user_id = Column(
        BigInteger,
        ForeignKey('5x5_users.id', ondelete='CASCADE', onupdate='CASCADE'),
        primary_key=True,
        nullable=False
    )
    email_id = Column(
        BigInteger,
        ForeignKey('5x5_emails.id', ondelete='CASCADE', onupdate='CASCADE'),
        primary_key=True,
        nullable=False
    )
    type = Column(
        String,
        primary_key=True,
        nullable=False
    )
