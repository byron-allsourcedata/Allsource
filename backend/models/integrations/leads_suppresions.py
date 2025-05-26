from models.base import Base
from sqlalchemy import VARCHAR, Integer, Column, JSON, Boolean, TIMESTAMP, BigInteger, text, String, ForeignKey, \
    Sequence
from datetime import datetime, timezone


class LeadsSupperssion(Base):
    __tablename__ = 'integrations_suppressed_contacts'

    id = Column(
        BigInteger,
        Sequence('integrations_suppressed_contacts_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    email = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    id_service = Column(String, nullable=True)
    domain_id = Column(
        BigInteger,
        ForeignKey('users_domains.id', ondelete='CASCADE'),
        nullable=False
    )
    integration_id = Column(
        BigInteger,
        ForeignKey('users_domains_integrations.id', ondelete='CASCADE'),
        nullable=False
    )
    created_at = Column(
        TIMESTAMP(timezone=False),
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
