from models.base import Base
from sqlalchemy import Integer, Column, TIMESTAMP, ForeignKey, Index, VARCHAR, BigInteger, text
from datetime import datetime


class SuppressedContact(Base):
    __tablename__ = 'suppressed_contacts'
    __table_args__ = (
        Index('ix_suppressed_contacts_domain_id', 'domain_id'),
    )

    id = Column(
        BigInteger,
        primary_key=True,
        nullable=False,
        server_default=text("nextval('leads_suppression_id_seq'::regclass)")
    )
    five_x_five_user_id = Column(
        BigInteger,
        ForeignKey('5x5_users.id', ondelete='CASCADE'),
        nullable=False
    )
    domain_id = Column(
        BigInteger,
        ForeignKey('users_domains.id', ondelete='CASCADE'),
        nullable=False
    )
    created_at = Column(
        TIMESTAMP,
        nullable=True
    )
    suppression_type = Column(
        VARCHAR,
        nullable=False
    )
    suppression_detail = Column(
        VARCHAR,
        nullable=False
    )
    requested_at = Column(
        TIMESTAMP,
        nullable=True
    )
