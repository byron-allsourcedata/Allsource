from datetime import datetime
from resolver import injectable

from enums import SettingStatus, TeamAccessLevel

from domains.mailing.teams.mailing import TeamsMailingService
from domains.mailing.teams.schemas import TeamInvitationTemplateSchema
from domains.teams.invitations.exceptions import (
    AccessDeniedError,
    InvalidAccessLevel,
    InvitationLimitReached,
    UserAlreadyInvited,
)
from persistence.team_invitation_persistence import TeamInvitationPersistence
from persistence.user_persistence import UserDict
from services.settings import SettingsService
from services.subscriptions import SubscriptionService


@injectable
class TeamsInvitationsService:
    def __init__(
        self,
        settings: SettingsService,
        team_mailing: TeamsMailingService,
        subscription_service: SubscriptionService,
        team_invitation_persistence: TeamInvitationPersistence,
    ) -> None:
        self.team_mailing = team_mailing
        self.subscription_service = subscription_service
        self.team_invitation_persistence = team_invitation_persistence
        self.settings = settings

    def invite_user(
        self,
        user: UserDict,
        invited_user_email: str,
        access_level: str | None = TeamAccessLevel.READ_ONLY.value,
    ):
        """
        Raises InvalidAccessLevel
        """
        user_id = user["id"]
        if not self.subscription_service.check_invitation_limit(
            user_id=user_id
        ):
            raise InvitationLimitReached()

        if access_level not in {
            TeamAccessLevel.ADMIN.value,
            TeamAccessLevel.OWNER.value,
            TeamAccessLevel.STANDARD.value,
            TeamAccessLevel.READ_ONLY.value,
        }:
            raise InvalidAccessLevel()

        if self.team_invitation_persistence.exists(
            user_id=user_id, email=invited_user_email
        ):
            raise UserAlreadyInvited()

        confirm_link, md5_hash = self.settings._generate_invitation_link(
            user_id=str(user_id), invited_user=invited_user_email
        )

        self.team_mailing.send_invite(
            from_user_id=user_id,
            to_email=invited_user_email,
            vars=TeamInvitationTemplateSchema(
                full_name=invited_user_email,
                link=confirm_link,
                company_name=user["full_name"],
            ),
        )

        invited_by_id = user.get("team_member", {}).get("id") or user_id
        self.team_invitation_persistence.create(
            team_owner_id=user_id,
            user_mail=invited_user_email,
            invited_by_id=invited_by_id,
            access_level=access_level,
            token=md5_hash,
        )

        return {"status": SettingStatus.SUCCESS}

    def resend_invitation_email(self, user: UserDict, invited_user_email: str):
        from_user_id = user["id"]
        if user.get("team_member") and user["team_member"].get(
            "team_access_level"
        ) not in {
            TeamAccessLevel.ADMIN.value,
            TeamAccessLevel.OWNER.value,
        }:
            raise AccessDeniedError()

        last_invite = self.team_invitation_persistence.get_by_user_and_email(
            user_id=user["id"], email=invited_user_email
        )
        if last_invite and last_invite.date_invited_at:
            time_diff = datetime.utcnow() - last_invite.date_invited_at
            if time_diff.total_seconds() < 300:
                return {"status": SettingStatus.TOO_SOON}

        confirm_link, _ = self.settings._generate_invitation_link(
            str(user["id"]), invited_user_email
        )

        self.team_mailing.send_invite(
            from_user_id=from_user_id,
            to_email=invited_user_email,
            vars=TeamInvitationTemplateSchema(
                full_name=invited_user_email,
                link=confirm_link,
                company_name=user["full_name"],
            ),
        )

        self.team_invitation_persistence.update_timestamp(
            user_id=user["id"],
            email=invited_user_email,
        )

        return {"status": SettingStatus.SUCCESS}
