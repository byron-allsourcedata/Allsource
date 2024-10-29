from sqlalchemy import Column, Integer, BOOLEAN, TEXT

from .base import Base


class UserAccountNotification(Base):
    __tablename__ = 'users_account_notifications'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False)
    notification_id = Column(Integer, nullable=False)
    params = Column(TEXT, nullable=False)
    is_checked = Column(BOOLEAN, nullable=False, default=False)
