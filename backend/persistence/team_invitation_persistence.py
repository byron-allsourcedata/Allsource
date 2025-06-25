from datetime import datetime
from db_dependencies import Db
from models.teams_invitations import TeamInvitation
from models.users import User
from sqlalchemy import desc
from enums import TeamsInvitationStatus
from typing import Optional

from resolver import injectable


@injectable
class TeamInvitationPersistence:
    def __init__(self, db: Db):
        self.db = db

    def get_by_user_and_email(
        self, user_id: int, email: str
    ) -> Optional[TeamInvitation]:
        return (
            self.db.query(TeamInvitation)
            .filter(
                TeamInvitation.team_owner_id == user_id,
                TeamInvitation.mail == email,
            )
            .order_by(desc(TeamInvitation.date_invited_at))
            .first()
        )

    def update_timestamp(self, user_id: int, email: str) -> None:
        invitation = (
            self.db.query(TeamInvitation)
            .filter(
                TeamInvitation.team_owner_id == user_id,
                TeamInvitation.mail == email,
            )
            .first()
        )
        if invitation:
            invitation.date_invited_at = datetime.utcnow()
            self.db.commit()

    def exists(self, user_id: int, email: str) -> bool:
        invitation_exists = (
            self.db.query(TeamInvitation)
            .filter(
                TeamInvitation.team_owner_id == user_id,
                TeamInvitation.mail == email,
            )
            .first()
            is not None
        )

        user_exists = (
            self.db.query(User).filter(User.email == email).first() is not None
        )

        return invitation_exists or user_exists

    def create(
        self,
        user_mail: str,
        access_level: str,
        invited_by_id: int,
        team_owner_id: int,
        token: str,
    ) -> None:
        invitation = TeamInvitation(
            mail=user_mail,
            access_level=access_level,
            status=TeamsInvitationStatus.PENDING.value,
            invited_by_id=invited_by_id,
            date_invited_at=datetime.utcnow(),
            team_owner_id=team_owner_id,
            token=token,
        )
        self.db.add(invitation)
        self.db.commit()

    def delete(self, user_id: int, email: str) -> None:
        self.db.query(TeamInvitation).filter(
            TeamInvitation.mail == email,
            TeamInvitation.team_owner_id == user_id,
        ).delete()
        self.db.commit()

    def get_all_by_user_id(self, user_id: int) -> list[TeamInvitation]:
        return (
            self.db.query(TeamInvitation)
            .filter(TeamInvitation.team_owner_id == user_id)
            .all()
        )

    def get_by_email(self, email: str) -> Optional[TeamInvitation]:
        return (
            self.db.query(TeamInvitation)
            .filter(TeamInvitation.mail == email)
            .first()
        )
