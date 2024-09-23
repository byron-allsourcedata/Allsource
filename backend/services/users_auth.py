import logging
import os
from datetime import datetime, timedelta
from datetime import timezone

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy.orm import Session

from enums import SignUpStatus, StripePaymentStatusEnum, LoginStatus, ResetPasswordEnum, \
    VerifyToken, UserAuthorizationStatus, SendgridTemplate
from models.users import User
from models.users import Users
from persistence.sendgrid_persistence import SendgridPersistence
from persistence.user_persistence import UserPersistence
from schemas.auth_google_token import AuthGoogleData
from schemas.users import UserSignUpForm, UserLoginForm, ResetPasswordForm
from services.payments_plans import PaymentsPlans
from . import stripe_service
from .jwt_service import get_password_hash, create_access_token, verify_password, decode_jwt_data
from .sendgrid import SendgridHandler
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
            customer_id=customer_id,
        )
        if not is_without_card:
            user_object.is_with_card = True
        self.db.add(user_object)
        self.db.commit()
        return user_object

    def create_account_google(self, auth_google_data: AuthGoogleData):
        token = AuthGoogleData.token
        client_id = os.getenv("CLIENT_GOOGLE_ID")
        google_request = google_requests.Request()
        is_without_card = auth_google_data.is_without_card
        idinfo = id_token.verify_oauth2_token(str(auth_google_data.token), google_request, client_id)
        if idinfo:
            full_name = idinfo.get('given_name')
            family_name = idinfo.get('family_name')
            if family_name and family_name != 'None':
                full_name = ' '.join(filter(None, [full_name, family_name]))
            google_payload = {
                "email": idinfo.get("email"),
                "full_name": full_name,
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
        if token:
            try:
                data = decode_jwt_data(token)
            except:
                raise ValueError(VerifyToken.INCORRECT_TOKEN)

            check_user_object = self.user_persistence.get_user_by_id(data.get('id'))
            
            if check_user_object:
                if self.user_persistence.check_status_invitations(team_owner_id=data.get('id'), mail=data.get('user_teams_mail')):
                    owner_id = data.get('id')
                    teams_owner_id = self.user_persistence_service.update_teams_owner_id(user_object.id, user_object.email, owner_id)
                    token_info = {
                        "id": teams_owner_id,
                        "team_member_id": user_object.id
                    }
        else:
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
            if user_object.team_owner_id:  
                token_info = {
                    "id": user_object.team_owner_id,
                    "team_member_id": user_object.id
                }
            else:
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
        token = user_form.token
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
        if token:
            try:
                data = decode_jwt_data(token)
            except:
                raise ValueError(VerifyToken.INCORRECT_TOKEN)

            check_user_object = self.user_persistence.get_user_by_id(data.get('id'))
            if check_user_object:
                if self.user_persistence.check_status_invitations(team_owner_id=data.get('id'), mail=data.get('user_teams_mail')):
                    owner_id = data.get('id')
                    self.user_persistence_service.update_teams_owner_id(user_object.id, user_object.email, owner_id)
                    token_info = {
                        "id": owner_id,
                        "team_member_id": user_object.id
                    }
        else:
            token_info = {
                "id": user_object.id,
            }
        
        token = create_access_token(token_info)
        logger.info("Token created")
        if is_without_card:
            template_id = self.send_grid_persistence_service.get_template_by_alias(
                SendgridTemplate.EMAIL_VERIFICATION_TEMPLATE.value)
            if not template_id:
                return {
                    'is_success': False,
                    'error': 'email template not found'
                }
            confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/authentication/verify-token?token={token}"
            mail_object = SendgridHandler()
            mail_object.send_sign_up_mail(
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
                if user_object.team_owner_id:
                    token_info = {
                    "id": user_object.team_owner_id,
                    "team_member_id": user_object.id
                    }
                else:
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
            if check_user_object.get('is_email_confirmed'):
                if check_user_object.team_owner_id:
                    token_info = {
                    "id": check_user_object.team_owner_id,
                    "team_member_id": check_user_object.id
                    }
                else:
                    token_info = {
                        "id": check_user_object.id,
                    }
                user_token = create_access_token(token_info)
                return {
                    'status': VerifyToken.EMAIL_ALREADY_VERIFIED,
                    'user_token': user_token
                }
            self.user_persistence_service.email_confirmed(check_user_object.get('id'))
            if check_user_object.team_owner_id:
                    token_info = {
                    "id": check_user_object.team_owner_id,
                    "team_member_id": check_user_object.id
                    }
            else:
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
            if db_user.team_owner_id:
                    token_info = {
                    "id": db_user.team_owner_id,
                    "team_member_id": db_user.id
                    }
            else:
                token_info = {
                    "id": db_user.id,
                }
            
            token = create_access_token(token_info)
            template_id = self.send_grid_persistence_service.get_template_by_alias(
                SendgridTemplate.FORGOT_PASSWORD_TEMPLATE.value)
            if db_user:
                confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/forgot-password?token={token}"
                mail_object = SendgridHandler()
                mail_object.send_sign_up_mail(
                    to_emails=db_user.email,
                    template_id=template_id,
                    template_placeholder={"full_name": db_user.full_name, "link": confirm_email_url,
                                          "email": db_user.email},
                )
                self.user_persistence_service.set_reset_password_sent_now(db_user.id)
                logger.info("Confirmation Email Sent")
                return ResetPasswordEnum.SUCCESS
        return ResetPasswordEnum.NOT_VALID_EMAIL
