from sqlalchemy import Column, Integer, BOOLEAN, TEXT, DateTime, Index
from sqlalchemy.sql import func
from .base import Base


class UserAccountNotification(Base):
    __tablename__ = 'users_account_notifications'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    notification_id = Column(Integer, nullable=False)
    params = Column(TEXT, nullable=False)
    is_checked = Column(BOOLEAN, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
Index('user_notification', UserAccountNotification.user_id, UserAccountNotification.id)
Index('users_account_notifications_user_id_notification_id_is_checked_', UserAccountNotification.user_id, UserAccountNotification.notification_id, UserAccountNotification.is_checked)
