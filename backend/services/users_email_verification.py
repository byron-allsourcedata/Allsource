import logging
import os
from datetime import datetime, timedelta

from .send_grid import SendGridPersistenceService
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
    def __init__(self, user: Users, user_persistence_service: UserPersistenceService, send_grid_persistence_service: SendGridPersistenceService):
        self.user = user
        self.user_persistence_service = user_persistence_service
        self.send_grid_persistence_service = send_grid_persistence_service

    def get_template_id(self, template_type: AutomationSystemTemplate) -> str:
        return template_type.value

    def resend_verification_email(self, token: str):
        if not self.user.is_email_confirmed:
            template_id = self.send_grid_persistence_service.get_template_by_alias(AutomationSystemTemplate.EMAIL_VERIFICATION_TEMPLATE)
            if not template_id:
                return {
                    'is_success': False,
                    'error': 'email template not found'
                }
            message_expiration_time = self.user.send_message_expiration_time
            time_now = datetime.now()
            if (message_expiration_time + timedelta(minutes=1)) > time_now:
                return {
                    'is_success': True,
                    'status': VerificationEmail.RESEND_TOO_SOON
                }
            confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/authentication/verify-token?token={token}&skip_pricing=true"
            mail_object = SendGridHandler()
            mail_object.send_sign_up_mail(
                subject="Please Verify Your Email",
                to_emails=self.user.email,
                template_id=template_id,
                template_placeholder={"Full_name": self.user.full_name, "Link": confirm_email_url},
            )
            logger.info("Confirmation Email Sent")
            return {
                'is_success': True,
                'status': VerificationEmail.CONFIRMATION_EMAIL_SENT
            }
        else:
            return {
                'is_success': True,
                'status': VerificationEmail.EMAIL_ALREADY_VERIFIED
            }

    def check_verification_status(self):
        if self.user.is_email_confirmed:
            return {
                'is_success': True,
                'status': VerificationEmail.EMAIL_VERIFIED
            }
        return {
            'is_success': True,
            'status': VerificationEmail.EMAIL_NOT_VERIFIED
        }

    def update_password(self, update_data: UpdatePassword):
        if update_data.password != update_data.confirm_password:
            return {
                'is_success': True,
                'status': UpdatePasswordStatus.PASSWORDS_DO_NOT_MATCH
            }
        self.user_persistence_service.update_password(self.user.id, update_data.password)
        return {
            'is_success': True,
            'status': UpdatePasswordStatus.PASSWORD_UPDATED_SUCCESSFULLY
        }
