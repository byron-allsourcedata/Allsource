from datetime import timezone, datetime

from sqlalchemy import Column, TIMESTAMP, ForeignKey, Index, VARCHAR, BigInteger, Sequence

from models.base import Base


class SuppressedContact(Base):
    __tablename__ = 'suppressed_contacts'
    __table_args__ = (
        Index('ix_suppressed_contacts_domain_id', 'domain_id'),
    )

    id = Column(
        BigInteger,
        Sequence('leads_suppression_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
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
        TIMESTAMP(timezone=False),
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
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
