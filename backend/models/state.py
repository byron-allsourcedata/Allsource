from sqlalchemy import Column, event, Integer
from sqlalchemy.dialects.postgresql import BOOLEAN, INTEGER, NUMERIC, TIMESTAMP, VARCHAR

from .base import Base, create_timestamps, update_timestamps


class States(Base):
    __tablename__ = "states"

    id = Column(Integer, primary_key=True, nullable=False)
    state_code = Column(VARCHAR(16), nullable=False, unique=True)
    state_name = Column(VARCHAR(64), nullable=True)
