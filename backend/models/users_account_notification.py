from sqlalchemy import Column, Integer, BOOLEAN, TEXT, DateTime, Index, BigInteger, text, ForeignKey, Boolean, Sequence
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.sql import func
from .base import Base


class UserAccountNotification(Base):
    __tablename__ = 'users_account_notifications'
    __table_args__ = (
        Index('user_notification', 'id', 'user_id', unique=True),
        Index('users_account_notifications_user_id_notification_id_is_checked_', 'user_id', 'notification_id',
              'is_checked'),
    )

    id = Column(
        BigInteger,
        Sequence('users_account_notifications_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    user_id = Column(
        BigInteger,
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False
    )
    notification_id = Column(
        BigInteger,
        ForeignKey('account_notifications.id', ondelete='CASCADE'),
        nullable=False
    )
    params = Column(
        TEXT,
        nullable=True
    )
    is_checked = Column(
        Boolean,
        nullable=False,
        server_default=text('false')
    )
    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
