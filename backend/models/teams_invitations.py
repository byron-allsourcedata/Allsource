from sqlalchemy import Column, event, Integer
from sqlalchemy.dialects.postgresql import BIGINT, TIMESTAMP, VARCHAR

from .base import Base, create_timestamps


class TeamInvitation(Base):
    __tablename__ = "teams_invitations"

    id = Column(Integer, primary_key=True, nullable=False)
    mail = Column(VARCHAR, nullable=False)
    access_level = Column(VARCHAR, nullable=False)
    status = Column(VARCHAR, nullable=False)
    date_invited_at = Column(TIMESTAMP(precision=7), nullable=False)
    invited_by_id = Column(BIGINT, nullable=False)
    team_owner_id = Column(BIGINT, nullable=False)
    token = Column(VARCHAR, nullable=False)

event.listen(TeamInvitation, "before_insert", create_timestamps)
