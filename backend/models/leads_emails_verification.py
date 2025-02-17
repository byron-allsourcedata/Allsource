from sqlalchemy import Column, event, Integer, TIMESTAMP, BOOLEAN, VARCHAR, Index
from .base import Base


class LeadEmailsVerification(Base):
    __tablename__ = "leads_emails_verifications"

    id = Column(Integer, primary_key=True, nullable=False)
    email = Column(VARCHAR(128), nullable=False)
    is_verify = Column(BOOLEAN, nullable=False, default=False)
    created_at = Column(TIMESTAMP, nullable=False)
    verify_result = Column(VARCHAR(64), nullable=False)
    
    __table_args__ = (
        Index('leads_emails_verification_email_idx', 'email'),
    )
