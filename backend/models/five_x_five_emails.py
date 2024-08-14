from sqlalchemy import Column, Integer, VARCHAR

from .base import Base


class FiveXFiveEmails(Base):
    __tablename__ = '5x5_emails'

    id = Column(Integer, primary_key=True)
    name = Column(VARCHAR, nullable=True)
