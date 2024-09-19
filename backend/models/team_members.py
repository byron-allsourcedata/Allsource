from sqlalchemy import Column, event, Integer, BOOLEAN
from sqlalchemy.dialects.postgresql import BIGINT, TIMESTAMP, VARCHAR
from sqlalchemy.orm import sessionmaker

from .base import Base, create_timestamps, update_timestamps
from .plans import SubscriptionPlan


class TeamMembers(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, nullable=False)
    user_name = Column(VARCHAR, nullable=True)
    last_signed_in = Column(TIMESTAMP, nullable=True)
    access_level = Column(VARCHAR, nullable=True)
    invited_by = Column(VARCHAR, nullable=True)
    added_on = Column(TIMESTAMP, nullable=True)
    status = Column(VARCHAR, nullable=False)
    date_invited = Column(TIMESTAMP(precision=7), nullable=True)

event.listen(TeamMembers, "before_insert", create_timestamps)
