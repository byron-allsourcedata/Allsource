from sqlalchemy import Column, Integer, VARCHAR

from .base import Base


class FiveXFiveUsersEmails(Base):
    __tablename__ = '5x5_users_emails'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=True)
    email_id = Column(Integer, nullable=True)
    type = Column(VARCHAR, nullable=True)
