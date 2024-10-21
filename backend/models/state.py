from sqlalchemy import Column, Integer
from sqlalchemy.dialects.postgresql import VARCHAR

from .base import Base


class States(Base):
    __tablename__ = "states"

    id = Column(Integer, primary_key=True, nullable=False)
    state_code = Column(VARCHAR(16), nullable=False, unique=True)
    state_name = Column(VARCHAR(64), nullable=True)
