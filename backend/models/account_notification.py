from sqlalchemy import Column, Integer, VARCHAR

from .base import Base


class AccountNotification(Base):
    __tablename__ = 'account_notifications'

    id = Column(Integer, primary_key=True, nullable=False)
    title = Column(VARCHAR(32), nullable=False)
    sub_title = Column(VARCHAR(32), nullable=False)
    text = Column(VARCHAR(128), nullable=False)

