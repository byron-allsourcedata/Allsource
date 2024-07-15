from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from . import stripe_service
from .jwt_service import get_password_hash, create_access_token, verify_password, decode_jwt_data
from persistence.sendgrid_persistence import SendgridPersistence
from .sendgrid import SendgridHandler
from persistence.user_persistence import UserPersistence
import os
from google.auth.transport import requests as google_requests
from services.payments_plans import PaymentsPlans
from models.users import Users
import logging
from google.oauth2 import id_token
from enums import SignUpStatus, StripePaymentStatusEnum, AutomationSystemTemplate, LoginStatus, ResetPasswordEnum, VerifyToken
from typing import Optional

from schemas.auth_google_token import AuthGoogleData
from schemas.users import UserSignUpForm, UserLoginForm, ResetPasswordForm

logger = logging.getLogger(__name__)


class UsersAuth:
    def __init__(self, db: Session, payments_service: PaymentsPlans, user_persistence_service: UserPersistence,
                 send_grid_persistence_service: SendgridPersistence):
        self.db = db
        self.payments_service = payments_service
        self.user_persistence_service = user_persistence_service
        self.send_grid_persistence_service = send_grid_persistence_service

    def get_utc_aware_date(self):
        return datetime.now(timezone.utc).replace(microsecond=0)

    def get_utc_aware_date_for_mssql(self, delta: timedelta = timedelta(seconds=0)):
        date = self.get_utc_aware_date()
        if delta:
            date += delta
        return date.isoformat()[:-6] + "Z"

    def add_user(self, is_without_card, customer_id: str, user_form: dict):
        user_object = Users(
            email=user_form.get("email"),
            is_email_confirmed=user_form.get("is_email_confirmed"),
            password=user_form.get("password"),
            is_company_details_filled=False,
            full_name=user_form.get("full_name"),
            created_at=self.get_utc_aware_date_for_mssql(),
            last_login=self.get_utc_aware_date_for_mssql(),
            payment_status=StripePaymentStatusEnum.PENDING.name,
            parent_id=0,
            customer_id=customer_id,
        )
        if not is_without_card:
            user_object.is_with_card = True
        self.db.add(user_object)
        self.db.commit()
        return user_object

    def create_account_google(self, auth_google_token: AuthGoogleData):
        client_id = os.getenv("CLIENT_GOOGLE_ID")
        google_request = google_requests.Request()
        is_without_card = auth_google_token.is_without_card
        idinfo = id_token.verify_oauth2_token(str(auth_google_token.token), google_request, client_id)
        if idinfo:
            google_payload = {
                "email": idinfo.get("email"),
                "full_name": f"{idinfo.get('given_name')} {idinfo.get('family_name')}",
                "password": None,
                "is_email_confirmed": True,
            }
            email = idinfo.get("email")
        else:
            return {
                'status': SignUpStatus.NOT_VALID_EMAIL
            }

        check_user_object = self.user_persistence_service.get_user_by_email(email)
        if check_user_object is not None:
            logger.info(f"User already exists in database with email: {email}")
            return {
                'status': SignUpStatus.EMAIL_ALREADY_EXISTS
            }

        customer_id = stripe_service.create_customer_google(google_payload)
        user_object = self.add_user(is_without_card=is_without_card, customer_id=customer_id, user_form=google_payload)
        self.user_persistence_service.update_user_parent_v2(user_object.get("id"))
        token_info = {
            "id": user_object.get("id"),
        }
        token = create_access_token(token_info)
        logger.info("Token created")
        self.user_persistence_service.email_confirmed(user_object.get("id"))
        if not user_object.get("is_with_card"):
            user_plan = self.plans_service.set_default_plan(user_object.get("id"), True)
            logger.info(f"Set plan {user_plan.title} for new user")
            return {
                'status': SignUpStatus.FILL_COMPANY_DETAILS,
                'token': token,
            }
        logger.info("Token created")
        return {
            'status': SignUpStatus.NEED_CHOOSE_PLAN,
            'token': token,
        }

    def get_user_authorization_status(self, user_object):
        if user_object.is_with_card:
            self.check_user_subscription(user_object)
        else:
            if not user_object.is_email_confirmed:
                return {
                    'is_success': True,
                    'status': LoginStatus.NEED_CONFIRM_EMAIL,
                }
            if not user_object.is_company_details_filled:
                return {
                    'is_success': True,
                    'status': LoginStatus.FILL_COMPANY_DETAILS,
                }

    def login_google(self, auth_google_token: AuthGoogleData):
        client_id = os.getenv("CLIENT_GOOGLE_ID")
        google_request = google_requests.Request()
        idinfo = id_token.verify_oauth2_token(auth_google_token.token, google_request, client_id)
        if idinfo:
            email = idinfo.get("email")
        else:
            return {
                'status': SignUpStatus.NOT_VALID_EMAIL
            }
        user_object = self.user_persistence_service.get_user_by_email(email)
        if user_object:
            token_info = {
                "id": user_object.id,
            }
            token = create_access_token(token_info)
            self.get_user_authorization_status(user_object)
            return {
                'status': LoginStatus.SUCCESS,
                'token': token
            }
        else:
            logger.info("Password Verification Failed")
            return {
                'status': LoginStatus.INCORRECT_PASSWORD_OR_EMAIL
            }

    def create_account(self, user_form: UserSignUpForm):
        user_form.password = get_password_hash(user_form.password)
        check_user_object = self.user_persistence_service.get_user_by_email(user_form.email)
        is_without_card = user_form.is_without_card
        if check_user_object is not None:
            logger.info(f"User already exists in database with email: {user_form.email}")
            return {
                'is_success': True,
                'status': SignUpStatus.EMAIL_ALREADY_EXISTS
            }
        customer_id = stripe_service.create_customer(user_form)
        user_object = self.add_user(is_without_card, customer_id, user_form)
        self.user_persistence_service.update_user_parent_v2(user_object.id)
        token_info = {
            "id": user_object.id,
        }
        token = create_access_token(token_info)
        logger.info("Token created")
        if is_without_card:
            template_id = self.send_grid_persistence_service.get_template_by_alias(
                AutomationSystemTemplate.EMAIL_VERIFICATION_TEMPLATE.value)
            if not template_id:
                return {
                    'is_success': False,
                    'error': 'email template not found'
                }
            confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/authentication/verify-token?token={token}"
            mail_object = SendgridHandler()
            mail_object.send_sign_up_mail(
                subject="Please Verify Your Email",
                to_emails=user_form.email,
                template_id=template_id,
                template_placeholder={"full_name": user_object.full_name, "link": confirm_email_url},
            )
            self.user_persistence_service.set_verified_email_sent_now(user_object.id)
            logger.info("Confirmation Email Sent")
            return {
                'is_success': True,
                'status': SignUpStatus.NEED_CONFIRM_EMAIL,
                'token': token,
            }
        logger.info("Token created")
        return {
            'is_success': True,
            'status': SignUpStatus.NEED_CHOOSE_PLAN,
            'token': token,
        }

    def check_user_subscription(self, user_object):
        # if not user_object.is_company_details_filled:
        #     return LoginStatus.FILL_COMPANY_DETAILS
        return {
            'is_success': True,
            'status': LoginStatus.NEED_CHOOSE_PLAN
        }

    def login_account(self, login_form: UserLoginForm):
        email = login_form.email
        password = login_form.password
        user_object = self.user_persistence_service.get_user_by_email(email)
        if not user_object:
            return {'status': LoginStatus.INCORRECT_PASSWORD_OR_EMAIL}
        if user_object:
            check_password = verify_password(password, user_object.password)
            if check_password:
                logger.info("Password verification passed")
                token_info = {
                    "id": user_object.id,
                }
                token = create_access_token(token_info)
                self.get_user_authorization_status(user_object)
                return {
                    'status': LoginStatus.SUCCESS,
                    'token': token
                }
            else:
                logger.info("Password Verification Failed")
                return {
                    'status': LoginStatus.INCORRECT_PASSWORD_OR_EMAIL
                }

    def verify_token(self, token):
        try:
            data = decode_jwt_data(token)
        except:
            return {'status': VerifyToken.INCORRECT_TOKEN}
        check_user_object = self.user_persistence_service.get_user_by_id(data.get('id'))
        if check_user_object:
            if check_user_object.is_email_confirmed:
                token_info = {
                    "id": check_user_object.id,
                }
                user_token = create_access_token(token_info)
                return {
                    'status': VerifyToken.EMAIL_ALREADY_VERIFIED,
                    'user_token': user_token
                }
            if check_user_object.is_with_card:
                user_plan = self.plans_service.set_default_plan(check_user_object.id, True)
                logger.info(f"Set plan {user_plan.title} for new user")
            self.user_persistence_service.email_confirmed(check_user_object.id)
            token_info = {
                "id": check_user_object.id,
            }
            user_token = create_access_token(token_info)
            return {
                'status': VerifyToken.SUCCESS,
                'user_token': user_token
            }
        return {'status': VerifyToken.INCORRECT_TOKEN}

    def reset_password(self, reset_password_form: ResetPasswordForm):
        if reset_password_form is not None and reset_password_form:
            db_user = self.user_persistence_service.get_user_by_email(reset_password_form.email)
            message_expiration_time = db_user.reset_password_sent_at
            time_now = datetime.now()
            if message_expiration_time is not None:
                if (message_expiration_time + timedelta(minutes=1)) > time_now:
                    return ResetPasswordEnum.RESEND_TOO_SOON
            token_info = {
                "id": db_user.id,
            }
            token = create_access_token(token_info)
            template_id = self.send_grid_persistence_service.get_template_by_alias(
                AutomationSystemTemplate.FORGOT_PASSWORD_TEMPLATE.value)
            if db_user:
                confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/forgot-password?token={token}"
                mail_object = SendgridHandler()
                mail_object.send_sign_up_mail(
                    subject="Maximize Password Reset Request",
                    to_emails=db_user.email,
                    template_id=template_id,
                    template_placeholder={"full_name": db_user.full_name, "link": confirm_email_url,
                                          "email": db_user.email},
                )
                self.user_persistence_service.set_reset_password_sent_now(db_user.id)
                logger.info("Confirmation Email Sent")
                return ResetPasswordEnum.SUCCESS
        return ResetPasswordEnum.NOT_VALID_EMAIL
