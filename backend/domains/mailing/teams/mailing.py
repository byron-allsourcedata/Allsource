from domains.mailing.sender import MailSenderService
from domains.mailing.teams.schemas import TeamInvitationTemplateSchema
from enums import SendgridTemplate
from resolver import injectable


@injectable
class TeamsMailingService:
    def __init__(self, mail_sender: MailSenderService) -> None:
        self.mail_sender = mail_sender

    def send_invite(
        self,
        from_user_id: int,
        to_email: str,
        vars: TeamInvitationTemplateSchema,
    ):
        """
        Raises TemplateNotFound
        """
        template_alias = SendgridTemplate.TEAM_MEMBERS_TEMPLATE.value

        template_vars = vars.__dict__

        _ = self.mail_sender.send_email_by_alias(
            to_email=to_email,
            template_alias=template_alias,
            templates=template_vars,
            from_user_id=from_user_id,
        )
