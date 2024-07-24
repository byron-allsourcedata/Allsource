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
from models.users import Users, User
import logging
from google.oauth2 import id_token
from enums import SignUpStatus, StripePaymentStatusEnum, AutomationSystemTemplate, LoginStatus, ResetPasswordEnum, \
    VerifyToken, UserAuthorizationStatus
from models.subscriptions import UserSubscriptions
from models.users import Users
from datetime import datetime, timedelta
from schemas.pixel_installation import PixelInstallationRequest
from schemas.auth_google_token import AuthGoogleData
from schemas.users import UserSignUpForm, UserLoginForm, ResetPasswordForm
from .subscriptions import SubscriptionService

logger = logging.getLogger(__name__)


class UsersAuth:
    def __init__(self, db: Session, payments_service: PaymentsPlans, user_persistence_service: UserPersistence,
                 send_grid_persistence_service: SendgridPersistence, subscription_service: SubscriptionService):
        self.db = db
        self.payments_service = payments_service
        self.user_persistence_service = user_persistence_service
        self.send_grid_persistence_service = send_grid_persistence_service
        self.subscription_service = subscription_service

    def get_utc_aware_date(self):
        return datetime.now(timezone.utc).replace(microsecond=0)

    def set_pixel_installed(self, pixel_installation_request: PixelInstallationRequest):
        if pixel_installation_request is not None:
            user = self.db.query(Users).filter(Users.data_provider_id == pixel_installation_request.client_id).first()
            if user and not user.is_pixel_installed:
                start_date = datetime.utcnow()
                end_date = start_date + timedelta(days=7)
                start_date_str = start_date.isoformat() + "Z"
                end_date_str = end_date.isoformat() + "Z"
                self.db.query(UserSubscriptions).filter(UserSubscriptions.user_id == user.id).update(
                    {UserSubscriptions.plan_start: start_date_str, UserSubscriptions.plan_end: end_date_str},
                    synchronize_session=False
                )
                self.db.query(Users).filter(Users.data_provider_id == pixel_installation_request.client_id).update(
                    {Users.is_pixel_installed: True},
                    synchronize_session=False)
                self.db.commit()
        return "OK"

    def get_utc_aware_date_for_mssql(self, delta: timedelta = timedelta(seconds=0)):
        date = self.get_utc_aware_date()
        if delta:
            date += delta
        return date.isoformat()[:-6] + "Z"

    def add_user(self, is_without_card, customer_id: str, user_form: dict):
        user_object = Users(
            email=user_form.get('email'),
            is_email_confirmed=user_form.get('is_email_confirmed', False),
            password=user_form.get('password'),
            is_company_details_filled=False,
            full_name=user_form.get('full_name'),
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

    def create_account_google(self, auth_google_data: AuthGoogleData):
        client_id = os.getenv("CLIENT_GOOGLE_ID")
        google_request = google_requests.Request()
        is_without_card = auth_google_data.is_without_card
        idinfo = id_token.verify_oauth2_token(str(auth_google_data.token), google_request, client_id)
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
        self.user_persistence_service.update_user_parent_v2(user_object.id)
        token_info = {
            "id": user_object.id,
        }
        token = create_access_token(token_info)
        logger.info("Token created")
        self.user_persistence_service.email_confirmed(user_object.id)
        if not user_object.is_with_card:
            return {
                'status': SignUpStatus.FILL_COMPANY_DETAILS,
                'token': token,
            }
        logger.info("Token created")
        return {
            'status': SignUpStatus.NEED_CHOOSE_PLAN,
            'token': token,
        }

    def get_user_authorization_information(self, user: User, subscription_service: SubscriptionService):
        if user.is_with_card:
            if user.company_name:
                subscription_plan_is_active = subscription_service.is_user_has_active_subscription(user.id)
                if subscription_plan_is_active:

                    return {'status': LoginStatus.SUCCESS}
                else:
                    return {'status': LoginStatus.NEED_CHOOSE_PLAN}
            else:
                return {'status': LoginStatus.FILL_COMPANY_DETAILS}
        else:
            if user.is_email_confirmed:
                if user.company_name:
                    if user.is_book_call_passed:
                        subscription_plan_is_active = subscription_service.is_user_has_active_subscription(user.id)
                        if subscription_plan_is_active:
                            if user.is_pixel_installed:
                                return {'status': LoginStatus.SUCCESS}
                            else:
                                return {'status': LoginStatus.PIXEL_INSTALLATION_NEEDED}
                        else:
                            if user.stripe_payment_url:
                                return {
                                    'status': LoginStatus.PAYMENT_NEEDED,
                                    'stripe_payment_url': user.stripe_payment_url
                                }
                            else:
                                return {'status': LoginStatus.NEED_CHOOSE_PLAN}
                    else:
                        return {'status': LoginStatus.NEED_BOOK_CALL}
                else:
                    return {'status': LoginStatus.FILL_COMPANY_DETAILS}
        return {'status': LoginStatus.NEED_CONFIRM_EMAIL}

    def login_google(self, auth_google_data: AuthGoogleData):
        client_id = os.getenv("CLIENT_GOOGLE_ID")
        google_request = google_requests.Request()
        idinfo = id_token.verify_oauth2_token(auth_google_data.token, google_request, client_id)
        if idinfo:
            email = idinfo.get("email")
        else:
            return {
                'status': LoginStatus.NOT_VALID_EMAIL
            }
        user_object = self.user_persistence_service.get_user_by_email(email)
        if user_object is None:
            return {
                'status': LoginStatus.INCORRECT_PASSWORD_OR_EMAIL
            }
        if not user_object.is_email_confirmed:
            self.user_persistence_service.email_confirmed(user_object.id)
        if user_object:
            token_info = {
                "id": user_object.id,
            }
            token = create_access_token(token_info)
            authorization_data = self.get_user_authorization_information(user_object, self.subscription_service)
            if authorization_data['status'] == LoginStatus.PAYMENT_NEEDED:
                return {
                    'status': authorization_data['status'].value,
                    'token': token,
                    'stripe_payment_url': authorization_data['stripe_payment_url']
                }
            if authorization_data['status'] != UserAuthorizationStatus.SUCCESS:
                return {
                    'status': authorization_data['status'].value,
                    'token': token
                }
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
        if not user_form.password:
            logger.debug("The password must not be empty.")
            return {
                'is_success': True,
                'status': SignUpStatus.PASSWORD_NOT_VALID
            }
        elif ' ' in user_form.password:
            logger.debug("The password must not contain spaces.")
            return {
                'is_success': True,
                'status': SignUpStatus.PASSWORD_NOT_VALID
            }
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
        user_data = {
            "email": user_form.email,
            "full_name": user_form.full_name,
            "password": user_form.password,
        }
        user_object = self.add_user(is_without_card, customer_id, user_form=user_data)
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
                authorization_data = self.get_user_authorization_information(user_object, self.subscription_service)
                if authorization_data['status'] == LoginStatus.PAYMENT_NEEDED:
                    return {
                        'status': authorization_data['status'].value,
                        'token': token,
                        'stripe_payment_url': authorization_data['stripe_payment_url']
                    }
                if authorization_data['status'] != LoginStatus.SUCCESS:
                    return {
                        'status': authorization_data['status'].value,
                        'token': token
                    }
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
            if db_user is None:
                return ResetPasswordEnum.SUCCESS
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
