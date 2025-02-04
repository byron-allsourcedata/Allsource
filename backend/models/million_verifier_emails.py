from sqlalchemy import Column, event, Integer, TIMESTAMP, BOOLEAN, VARCHAR, Index
from .base import Base, create_timestamps, update_timestamps


class MillionVerifierEmail(Base):
    __tablename__ = "million_verifier_email"

    id = Column(Integer, primary_key=True, nullable=False)
    email = Column(VARCHAR(64), nullable=False)
    is_verify = Column(BOOLEAN, nullable=False, default=False)
    created_at = Column(TIMESTAMP, nullable=False)
    
    __table_args__ = (
        Index('million_verifier_email_email_idx', 'email'),
    )
