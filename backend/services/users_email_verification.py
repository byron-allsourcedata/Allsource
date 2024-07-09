import logging
import os
from .sendgrid import SendGridHandler
from .user_persistence_service import UserPersistenceService
from enums import AutomationSystemTemplate, VerificationEmail, UpdatePasswordStatus
from models.users import Users
from schemas.users import UpdatePassword

logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class UsersEmailVerificationService:
    def __init__(self, user: Users, user_persistence_service: UserPersistenceService):
        self.user = user
        self.user_persistence_service = user_persistence_service

    def get_template_id(self, template_type: AutomationSystemTemplate) -> str:
        return template_type.value

    def resend_verification_email(self, token: str):
        if not self.user.is_email_confirmed:
            confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/authentication/verify-token?token={token}&skip_pricing=true"
            mail_object = SendGridHandler()
            mail_object.send_sign_up_mail(
                subject="Please Verify Your Email Address",
                to_emails=self.user.email,
                template_id=self.get_template_id(AutomationSystemTemplate.EMAIL_VERIFICATION_TEMPLATE),
                template_placeholder={"Full_name": self.user.full_name, "Link": confirm_email_url},
            )
            logger.info("Confirmation Email Sent")
            return {
                'status': VerificationEmail.CONFIRMATION_EMAIL_SENT
            }
        else:
            return {
                'status': VerificationEmail.EMAIL_ALREADY_VERIFIED
            }

    def check_verification_status(self):
        if self.user.is_email_confirmed:
            return {
                'status': VerificationEmail.EMAIL_VERIFIED
            }
        return {
            'status': VerificationEmail.EMAIL_NOT_VERIFIED
        }

    def update_password(self, update_data: UpdatePassword):
        if update_data.password != update_data.confirm_password:
            return {
                'status': UpdatePasswordStatus.PASSWORDS_DO_NOT_MATCH
            }
        self.user_persistence_service.update_password(self.user.id, update_data.password)
        return {
            'status': UpdatePasswordStatus.PASSWORD_UPDATED_SUCCESSFULLY
        }
