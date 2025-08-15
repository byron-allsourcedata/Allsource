import logging
import os
from typing import Any
from config.sendgrid import MailingConfig
from domains.mailing.exceptions import InvalidTemplateAlias
from domains.whitelabel.schemas import (
    FilledWhitelabelSettingsSchema,
    WhitelabelSettingsSchema,
)
from enums import SendgridTemplate
from persistence.sendgrid_persistence import SendgridPersistence
from persistence.user_persistence import UserPersistence
from resolver import injectable
from services.sendgrid import SendgridHandler

logger = logging.getLogger(__name__)


@injectable
class MailingService:
    def __init__(
        self, repo: SendgridPersistence, users_repo: UserPersistence
    ) -> None:
        self.repo = repo
        self.users_repo = users_repo

    def send_email(
        self, to_email: str, template_id: str, templates: dict[str, str]
    ) -> dict[str, Any]:
        mail_object = SendgridHandler()
        response = mail_object.send_sign_up_mail(
            to_emails=to_email,
            template_id=template_id,
            template_placeholder=templates,
        )

        return response

    def send_verification_email(
        self,
        user_email: str,
        user_full_name: str,
        token: str,
        whitelabel_settings: WhitelabelSettingsSchema,
    ):
        """
        Raises InvalidTemplateAlias
        """

        whitelabel = self.fill_whitelabel_settings(whitelabel_settings)

        template_id = self.repo.get_template_by_alias(
            SendgridTemplate.EMAIL_VERIFICATION_TEMPLATE.value
        )

        if not template_id:
            raise InvalidTemplateAlias()

        confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/authentication/verify-token?token={token}"

        _ = self.send_email(
            to_email=user_email,
            template_id=template_id,
            templates={
                "full_name": user_full_name,
                "link": confirm_email_url,
                "logo_src": whitelabel.brand_logo_url,
                "whitelabel_name": whitelabel.brand_name,
            },
        )
        logger.info("Confirmation Email Sent")

    def fill_whitelabel_settings(
        self, settings: WhitelabelSettingsSchema
    ) -> FilledWhitelabelSettingsSchema:
        default_logo_src = MailingConfig.default_logo_src
        default_whitelabel_name = MailingConfig.default_whitelabel_name

        brand_logo: str = default_logo_src
        whitelabel_name: str = default_whitelabel_name

        if settings.brand_logo_url is not None:
            brand_logo = settings.brand_logo_url
        if settings.brand_name is not None:
            whitelabel_name = settings.brand_name

        return FilledWhitelabelSettingsSchema(
            brand_name=whitelabel_name,
            brand_logo_url=brand_logo,
        )
