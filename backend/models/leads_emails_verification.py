from sqlalchemy import Column, event, Integer, TIMESTAMP, BOOLEAN, VARCHAR, Index, BigInteger, text, Boolean, Sequence
from .base import Base


class LeadEmailsVerification(Base):
    __tablename__ = "leads_emails_verifications"
    __table_args__ = (
        Index('leads_emails_verification_email_idx', 'email', unique=True),
    )

    id = Column(
        BigInteger,
        Sequence('million_verifier_email_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    email = Column(VARCHAR(128), nullable=False)
    is_verify = Column(Boolean, nullable=False)
    created_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    verify_result = Column(VARCHAR(64), nullable=False)
