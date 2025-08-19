import logging
from domains.mailing.sender import MailSenderService
from resolver import injectable

logger = logging.getLogger(__name__)


@injectable
class PixelCodeMailingService:
    def __init__(self, sender: MailSenderService):
        self.sender = sender

    def send_pixel_code(
        self,
        full_name: str,
        user_email: str,
        template_id: str,
        pixel_code: str,
        from_user_id: int,
    ) -> None:
        email = user_email
        template_placeholder = {
            "full_name": full_name,
            "pixel_code": pixel_code,
            "email": email,
        }

        _ = self.sender.send_email(
            to_email=email,
            template_id=template_id,
            templates=template_placeholder,
            from_user_id=from_user_id,
        )
