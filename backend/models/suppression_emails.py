from sqlalchemy import Column, Integer, VARCHAR
from sqlalchemy.orm import relationship

from .base import Base


class SuppressionEmails(Base):
    __tablename__ = "suppression_emails"

    id = Column(Integer, primary_key=True, nullable=False)
    email = Column(VARCHAR, nullable=False, default=False)
    
    suppressions = relationship("Rules", back_populates="suppression_emails")
    suppressions_list = relationship("SuppressionList", back_populates="suppression_emails")  # Убедитесь, что названия моделей верные
