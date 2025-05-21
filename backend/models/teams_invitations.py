from sqlalchemy import Column, event, Integer, ForeignKey, BigInteger, text, Index, Sequence
from sqlalchemy.dialects.postgresql import BIGINT, TIMESTAMP, VARCHAR

from .base import Base, create_timestamps


class TeamInvitation(Base):
    __tablename__ = 'teams_invitations'
    __table_args__ = (
        Index('teams_invitations_mail_team_owner_id_idx', 'mail', 'team_owner_id'),
        Index('teams_invitations_md5_hash_idx', 'token'),
    )

    id = Column(
        BigInteger,
        Sequence('team_members_id_seq', metadata=Base.metadata),
        primary_key=True,
        nullable=False,
    )
    mail = Column(
        VARCHAR(64),
        nullable=True
    )
    access_level = Column(
        VARCHAR(64),
        nullable=True
    )
    status = Column(
        VARCHAR(32),
        nullable=True
    )
    date_invited_at = Column(
        TIMESTAMP(precision=7),
        nullable=True
    )
    invited_by_id = Column(
        BigInteger,
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=True
    )
    team_owner_id = Column(
        BigInteger,
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=True
    )
    token = Column(
        VARCHAR(64),
        nullable=True
    )


event.listen(TeamInvitation, "before_insert", create_timestamps)
