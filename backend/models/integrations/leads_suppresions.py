from models.base import Base
from sqlalchemy import VARCHAR, Integer, Column, JSON, Boolean, TIMESTAMP, BigInteger, text, String, ForeignKey
from datetime import datetime


class LeadsSupperssion(Base):
    __tablename__ = 'integrations_suppressed_contacts'

    id = Column(
        BigInteger,
        primary_key=True,
        nullable=False,
        server_default=text("nextval('integrations_suppressed_contacts_id_seq'::regclass)")
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
    created_at = Column(TIMESTAMP, nullable=True)
