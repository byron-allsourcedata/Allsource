import os
import logging
from time import sleep

from .sendgrid import SendGridHandler
from .user_persistence_service import UserPersistenceService
from ..enums import AutomationSystemTemplate, BaseEnum

logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class Users:
    def __init__(self, user: dict, user_persistence_service: UserPersistenceService):
        self.user = user

        self.user_persistence_service = user_persistence_service

    def get_my_info(self):
        db_user = self.user_persistence_service.get_user_by_id(self.user.id)
        sleep(10)
        return {"email": db_user.email}

    def get_template_id(self, template_type: AutomationSystemTemplate) -> str:
        return template_type.value
    def resend_verification_email(self, token: str):
        if self.user:
            db_user = self.user_persistence_service.get_user_by_id(self.user.id)
            if db_user:
                confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/authentication/verify-token?token={token}&skip_pricing=true"
                mail_object = SendGridHandler()
                mail_object.send_sign_up_mail(
                    subject="Please Verify Your Email Address",
                    to_emails=db_user.email,
                    template_id=self.get_template_id(AutomationSystemTemplate.EMAIL_VERIFICATION_TEMPLATE),
                    template_placeholder={"Full_name": db_user.full_name, "Link": confirm_email_url},
                )
                logger.info("Confirmation Email Sent")
                return {
                    'status': BaseEnum.SUCCESS
                }

    def check_verification_status(self):
        if self.user:
            db_user = self.user_persistence_service.get_user_by_id(self.user.id)
            if db_user:
                if db_user.email_confirmed:
                    return {
                        'status': BaseEnum.SUCCESS
                    }
        return {
            'status': BaseEnum.FAILURE
        }