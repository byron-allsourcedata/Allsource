from sqlalchemy import Column, Integer, VARCHAR

from .base import Base


class FiveXFiveUsersEmails(Base):
    __tablename__ = '5x5_users_emails'

    user_id = Column(Integer, nullable=True, primary_key=True)
    email_id = Column(Integer, nullable=True, primary_key=True)
    type = Column(VARCHAR, nullable=True, primary_key=True)
