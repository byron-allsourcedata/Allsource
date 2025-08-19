import logging
import os
from typing import Any
from config.sendgrid import MailingConfig
from domains.mailing.exceptions import InvalidTemplateAlias
from domains.mailing.pixel_code.service import PixelCodeMailingService
from domains.mailing.schemas import FilledWhitelabelSettingsSchema
from domains.mailing.sender import MailSenderService
from domains.mailing.whitelabel import MailingWhitelabelService
from domains.whitelabel.schemas import (
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
        self,
        repo: SendgridPersistence,
        users_repo: UserPersistence,
        pixel_code: PixelCodeMailingService,
        whitelabel: MailingWhitelabelService,
        sender: MailSenderService,
    ) -> None:
        self.repo = repo
        self.users_repo = users_repo
        self.whitelabel = whitelabel
        self.sender = sender

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

        whitelabel = self.whitelabel.fill_whitelabel_settings(
            whitelabel_settings
        )

        template_id = self.repo.get_template_by_alias(
            SendgridTemplate.EMAIL_VERIFICATION_TEMPLATE.value
        )

        if not template_id:
            raise InvalidTemplateAlias()

        confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/authentication/verify-token?token={token}"

        _ = self.sender.send_email(
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
