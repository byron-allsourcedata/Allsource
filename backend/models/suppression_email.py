from sqlalchemy import Column, Integer, VARCHAR
from sqlalchemy.orm import relationship

from .base import Base


class SuppressionEmail(Base):
    __tablename__ = "suppressions_emails"

    id = Column(Integer, primary_key=True, nullable=False)
    email = Column(VARCHAR, nullable=False, default=False)
