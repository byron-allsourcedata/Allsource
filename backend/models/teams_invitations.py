from sqlalchemy import Column, event, Integer, BOOLEAN
from sqlalchemy.dialects.postgresql import BIGINT, TIMESTAMP, VARCHAR
from sqlalchemy.orm import sessionmaker

from .base import Base, create_timestamps, update_timestamps
from .plans import SubscriptionPlan


class TeamsInvitations(Base):
    __tablename__ = "teams_invitations"

    id = Column(Integer, primary_key=True, nullable=False)
    mail = Column(VARCHAR, nullable=True)
    access_level = Column(VARCHAR, nullable=True)
    status = Column(VARCHAR, nullable=False)
    invited_by = Column(VARCHAR, nullable=False)
    date_invited = Column(TIMESTAMP(precision=7), nullable=True)
    teams_owner_id = Column(BIGINT, nullable=True)
    token_invitation = Column(VARCHAR, nullable=False)

event.listen(TeamsInvitations, "before_insert", create_timestamps)
