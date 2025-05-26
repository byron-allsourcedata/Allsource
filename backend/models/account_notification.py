from sqlalchemy import Column, Integer, Sequence, String, Boolean

from .base import Base


class AccountNotification(Base):
    __tablename__ = 'account_notifications'

    id = Column(
        Integer,
        Sequence('account_notifications_id_seq'),
        primary_key=True,
        nullable=False
    )
    title = Column(String(64), nullable=True)
    text = Column(String(256), nullable=True)
    sub_title = Column(String(64), nullable=True)
    is_dismiss = Column(Boolean, nullable=False, server_default='true')
