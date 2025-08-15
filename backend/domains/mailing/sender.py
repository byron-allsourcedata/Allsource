from typing import Any
from domains.mailing.schemas import FilledWhitelabelSettingsSchema
from domains.mailing.whitelabel import MailingWhitelabelService
from resolver import injectable
from services.sendgrid import SendgridHandler


@injectable
class MailSenderService:
    def __init__(self, whitelabel: MailingWhitelabelService):
        self.whitelabel = whitelabel

    def send_email_with_whitelabel(
        self,
        to_email: str,
        template_id: str,
        templates: dict[str, str],
        whitelabel_settings: FilledWhitelabelSettingsSchema,
    ) -> dict[str, Any]:
        whitelabel_vars_dict = whitelabel_settings.__dict__
        templates_clone = {**templates, **whitelabel_vars_dict}

        mail_object = SendgridHandler()
        response = mail_object.send_sign_up_mail(
            to_emails=to_email,
            template_id=template_id,
            template_placeholder=templates_clone,
        )

        return response

    def send_email(
        self,
        to_email: str,
        template_id: str,
        templates: dict[str, str],
        from_user_id: int | None = None,
    ) -> dict[str, Any]:
        if from_user_id is not None:
            whitelabel_vars = self.whitelabel.get_template_variables(
                from_user_id
            )
            return self.send_email_with_whitelabel(
                to_email=to_email,
                template_id=template_id,
                templates=templates,
                whitelabel_settings=whitelabel_vars,
            )

        mail_object = SendgridHandler()
        response = mail_object.send_sign_up_mail(
            to_emails=to_email,
            template_id=template_id,
            template_placeholder=templates,
        )

        return response
