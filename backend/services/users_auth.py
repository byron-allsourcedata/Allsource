from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from . import stripe_service
from .jwt_service import get_password_hash, create_access_token, verify_password, decode_jwt_data
from .sendgrid import SendGridHandler
from .user_persistence_service import UserPersistenceService
import os
from google.auth.transport import requests as google_requests
from backend.services.payments_plans import PaymentsPlans
from backend.models.users import Users
import logging
from google.oauth2 import id_token
from backend.enums import SignUpStatus, StripePaymentStatusEnum, AutomationSystemTemplate, LoginStatus, BaseEnum
from typing import Optional

from backend.schemas.auth_google_token import AuthGoogleToken
from backend.schemas.users import UserSignUpForm, UserLoginForm, ResetPassword

logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

class UsersAuth:
    def __init__(self, db: Session, plans_service: PaymentsPlans, user_persistence_service: UserPersistenceService):
        self.db = db
        self.plans_service = plans_service
        self.user_persistence_service = user_persistence_service

    def get_utc_aware_date(self):
        return datetime.now(timezone.utc).replace(microsecond=0)

    def get_utc_aware_date_for_mssql(self, delta: timedelta = timedelta(seconds=0)):
        date = self.get_utc_aware_date()
        if delta:
            date += delta
        return date.isoformat()[:-6] + "Z"

    def add_user(self, is_without_card, customer_id: str, user_form: Optional[dict] = None, google_payload: Optional[dict] = None):
        user_object = Users(
            email=user_form.email if google_payload is None or len(google_payload) == 0 else google_payload.get("email"),
            is_email_confirmed=False,
            password=user_form.password,
            is_company_details_filled=False,
            full_name=user_form.full_name if google_payload is None or len(google_payload) == 0 else google_payload.get(
                "full_name"),
            image=user_form.image if hasattr(user_form, 'image') else None,
            company=user_form.image if hasattr(user_form, 'company') else None,
            created_at=self.get_utc_aware_date_for_mssql(),
            last_login=self.get_utc_aware_date_for_mssql(),
            payment_status=StripePaymentStatusEnum.PENDING.name,
            parent_id=0,
            customer_id=customer_id,
            website=user_form.image if hasattr(user_form, 'website') else None
        )
        if not is_without_card:
            user_object.is_with_card = True
        self.db.add(user_object)
        self.db.commit()
        token_info = {
            "id": user_object.id,
        }
        return token_info

    def get_template_id(self, template_type: AutomationSystemTemplate) -> str:
        return template_type.value

    def create_account_google(self, auth_google_token: AuthGoogleToken):
        response = {}
        CLIENT_ID = os.getenv("CLIENT_ID")
        google_request = google_requests.Request()
        is_without_card = auth_google_token.is_without_card
        idinfo = id_token.verify_oauth2_token(auth_google_token, google_request, CLIENT_ID)
        if idinfo:
            google_payload = {
                "email": idinfo.get("email"),
                "full_name": f"{idinfo.get('given_name')} {idinfo.get('family_name')}"
            }
            email = idinfo.get("email")
        else:
            return {
                'status': SignUpStatus.NOT_VALID_EMAIL
            }
        check_user_object = self.user_persistence_service.get_user(email)
        if check_user_object is not None:
            logger.info(f"User already exists in database with email: {email}")
            return {
                'status': SignUpStatus.EMAIL_ALREADY_EXISTS
            }
        customer_id = stripe_service.create_customer(google_payload)
        user_object = self.add_user(is_without_card, customer_id=customer_id, google_payload=google_payload)
        self.user_persistence_service.update_user_parent_v2(user_object.get("user_filed_id"))
        token = self.create_access_token(user_object)
        response.update({"token": token})
        logger.info("Token created")
        self.user_persistence_service.email_confirmed(user_object.id)
        user_plan = self.plans_service.set_default_plan(self.db, user_object.get("user_filed_id"), True)
        logger.info(f"Set plan {user_plan.title} for new user")
        logger.info("Token created")
        return {
            'status': SignUpStatus.NEED_CHOOSE_PLAN,
            'token': token,
        }

    def create_account(self, user_form: UserSignUpForm):
        response = {}
        user_form.password = get_password_hash(user_form.password)
        check_user_object = self.user_persistence_service.get_user(user_form.email)
        is_without_card = user_form.is_without_card
        if check_user_object is not None:
            logger.info(f"User already exists in database with email: {user_form.email}")
            return {
                'status': SignUpStatus.EMAIL_ALREADY_EXISTS
            }
        customer_id = stripe_service.create_customer(user_form)
        user_object = self.add_user(is_without_card, customer_id, user_form)
        self.user_persistence_service.update_user_parent_v2(user_object.get("user_filed_id"))
        token = create_access_token(user_object)
        response.update({"token": token})
        logger.info("Token created")
        if is_without_card:
            confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/authentication/verify-token?token={token}&skip_pricing=true"
            mail_object = SendGridHandler()
            mail_object.send_sign_up_mail(
                subject="Please Verify Your Email Address",
                to_emails=user_form.email,
                template_id=self.get_template_id(AutomationSystemTemplate.EMAIL_VERIFICATION_TEMPLATE),
                template_placeholder={"Full_name": user_object.get("full_name"), "Link": confirm_email_url},
            )
            logger.info("Confirmation Email Sent")
            return {
                'status': SignUpStatus.NEED_CONFIRM_EMAIL,
                'token': token,
            }
        else:
            user_plan = self.plans_service.set_default_plan(user_object.get("user_filed_id"), False)
            logger.info(f"Set plan {user_plan.title} for new user")
        logger.info("Token created")
        return {
            'status': SignUpStatus.NEED_CHOOSE_PLAN,
            'token': token,
        }

    def login_account(self, login_form: UserLoginForm):
        email = login_form.email
        password = login_form.password
        user_object = self.user_persistence_service.get_user(email)
        if user_object:
            check_password = verify_password(password, user_object.password)
            if check_password:
                logger.info("Password verification passed")
                token_info = {
                    "id": user_object.id,
                }
                token = create_access_token(token_info)
                return {
                    'status': LoginStatus.SUCCESS,
                    'token': token,
                    'email': email
                }
            else:
                logger.info("Password Verification Failed")
                return {
                    'status': LoginStatus.INCORRECT_PASSWORD_OR_EMAIL
                }

    def verify_token(self, token, skip_pricing):
        data = decode_jwt_data(token)
        check_user_object = self.user_persistence_service.get_user_by_id(data.get('id'))
        if check_user_object:
            if skip_pricing:
                user_plan = self.plans_service.set_default_plan(check_user_object.id, True)
                self.user_persistence_service.email_confirmed(check_user_object.id)
                logger.info(f"Set plan {user_plan.title} for new user")
            self.user_persistence_service.email_confirmed(check_user_object.id)
            return {
                'status': BaseEnum.SUCCESS
            }
        return {
            'status': BaseEnum.FAILURE
        }

    def reset_password(self, reset_password: ResetPassword):
        if reset_password is not None and reset_password:
            db_user = self.user_persistence_service.get_user(reset_password)
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
        return {
            'status': SignUpStatus.NOT_VALID_EMAIL
        }
