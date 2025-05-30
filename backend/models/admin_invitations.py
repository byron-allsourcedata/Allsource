from datetime import datetime, timezone

from sqlalchemy import Column, ForeignKey, BigInteger, Index, Sequence
from sqlalchemy.dialects.postgresql import TIMESTAMP, VARCHAR

from .base import Base


class AdminInvitation(Base):
    __tablename__ = 'admin_invitations'

    id = Column(
        BigInteger,
        Sequence('team_members_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    email = Column(
        VARCHAR(64),
        nullable=False,
        unique=True
    )
    date_invited_at = Column(TIMESTAMP, nullable=False, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    invited_by_id = Column(
        BigInteger,
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False
    )
    token = Column(
        VARCHAR(64),
        nullable=False
    )
    __table_args__ = (
        Index('admin_invitations_md5_hash_idx', token),
    )

