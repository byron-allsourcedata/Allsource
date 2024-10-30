import logging
import os
from datetime import datetime, timedelta
from datetime import timezone

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy.orm import Session

from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from enums import SignUpStatus, LoginStatus, ResetPasswordEnum, \
    VerifyToken, UserAuthorizationStatus, SendgridTemplate, NotificationTitles
from models.account_notification import AccountNotification
from models.users import Users
from models.users_account_notification import UserAccountNotification
from persistence.plans_persistence import PlansPersistence
from persistence.sendgrid_persistence import SendgridPersistence
from persistence.user_persistence import UserPersistence
from schemas.auth_google_token import AuthGoogleData
from schemas.users import UserSignUpForm, UserLoginForm, ResetPasswordForm
from services.payments_plans import PaymentsPlans
from . import stripe_service
from .jwt_service import get_password_hash, create_access_token, verify_password, decode_jwt_data
from .sendgrid import SendgridHandler
from .stripe_service import create_stripe_checkout_session
from .subscriptions import SubscriptionService

EMAIL_NOTIFICATIONS = 'email_notifications'
logger = logging.getLogger(__name__)


class UsersAuth:
    def __init__(self, db: Session, payments_service: PaymentsPlans, user_persistence_service: UserPersistence,
                 send_grid_persistence_service: SendgridPersistence, subscription_service: SubscriptionService,
                 plans_persistence: PlansPersistence
                 ):
        self.db = db
        self.payments_service = payments_service
        self.user_persistence_service = user_persistence_service
        self.send_grid_persistence_service = send_grid_persistence_service
        self.subscription_service = subscription_service
        self.plan_persistence = plans_persistence

    def get_utc_aware_date(self):
        return datetime.now(timezone.utc).replace(microsecond=0)

    def get_user_authorization_status_without_pixel(self, user):
        if user.get('is_with_card'):
            if user.get('company_name'):
                subscription_plan_is_active = self.subscription_service.is_user_has_active_subscription(user.get('id'))
                if subscription_plan_is_active:
                    return UserAuthorizationStatus.SUCCESS
                if user.get('stripe_payment_url'):
                    return UserAuthorizationStatus.PAYMENT_NEEDED
                return UserAuthorizationStatus.NEED_CHOOSE_PLAN
            return UserAuthorizationStatus.FILL_COMPANY_DETAILS
        if user.get('is_email_confirmed'):
            if user.get('company_name'):
                if user.get('is_book_call_passed'):
                    subscription_plan_is_active = self.subscription_service.is_user_has_active_subscription(
                        user.get('id'))
                    if subscription_plan_is_active:
                        return UserAuthorizationStatus.SUCCESS
                    if user.get('stripe_payment_url'):
                        return UserAuthorizationStatus.PAYMENT_NEEDED
                    return UserAuthorizationStatus.NEED_CHOOSE_PLAN
                return UserAuthorizationStatus.NEED_BOOK_CALL
            return UserAuthorizationStatus.FILL_COMPANY_DETAILS
        return UserAuthorizationStatus.NEED_CONFIRM_EMAIL

    def get_utc_aware_date_for_mssql(self, delta: timedelta = timedelta(seconds=0)):
        date = self.get_utc_aware_date()
        if delta:
            date += delta
        return date.isoformat()[:-6] + "Z"

    async def send_member_notification(self, user_id, title, notification_id):
        account_notification = self.db.query(AccountNotification).where(AccountNotification.title == title).first()
        queue_name = f'sse_events_{str(user_id)}'
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        try:
            await publish_rabbitmq_message(
                connection=connection,
                queue_name=queue_name,
                message_body={'notification_text': account_notification.text, 'notification_id': notification_id}
            )
        except:
            await rabbitmq_connection.close()
        finally:
            await rabbitmq_connection.close()

    async def publish_email_notification(self, email, title, params=None):
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        await publish_rabbitmq_message(
            connection=connection,
            queue_name=EMAIL_NOTIFICATIONS,
            message_body={
                'email': email,
                'data': {
                    'sendgrid_alias': title,
                    'params': params
                }
            }
        )
        logging.info(f"Push to RMQ: {{'email:': {email}, 'sendgrid_alias': {title}}}")

    def save_account_notification(self, user_id, title, params=None):
        account_notification = self.db.query(AccountNotification).where(AccountNotification.title == title).first()
        account_notification = UserAccountNotification(
            user_id=user_id,
            notification_id=account_notification.id,
            params=str(params),

        )
        self.db.add(account_notification)
        self.db.commit()
        return account_notification.id

    def add_user(self, is_without_card, customer_id: str, user_form: dict, spi: str):
        stripe_payment_url = None
        if spi:
            trial_period = self.plan_persistence.get_plan_by_price_id(spi).trial_days
            stripe_payment_url = create_stripe_checkout_session(
                customer_id=customer_id,
                line_items=[{"price": spi, "quantity": 1}],
                mode="subscription",
                trial_period=trial_period
            )
        user_object = Users(
            email=user_form.get('email'),
            is_email_confirmed=user_form.get('is_email_confirmed', False),
            password=user_form.get('password'),
            is_company_details_filled=False,
            full_name=user_form.get('full_name'),
            created_at=self.get_utc_aware_date_for_mssql(),
            last_login=self.get_utc_aware_date_for_mssql(),
            customer_id=customer_id,
            last_signed_in=datetime.now(),
            added_on=datetime.now(),
            stripe_payment_url=stripe_payment_url.get('link') if stripe_payment_url else None

        )
        if not is_without_card:
            user_object.is_with_card = True
        self.db.add(user_object)
        self.db.commit()
        return user_object

    def create_account_google(self, auth_google_data: AuthGoogleData):
        teams_token = auth_google_data.teams_token
        owner_id = None
        status = SignUpStatus.NEED_CHOOSE_PLAN
        client_id = os.getenv("CLIENT_GOOGLE_ID")
        google_request = google_requests.Request()
        is_without_card = auth_google_data.is_without_card
        idinfo = id_token.verify_oauth2_token(str(auth_google_data.token), google_request, client_id)
        if idinfo:
            if teams_token:
                status = SignUpStatus.SUCCESS
                status_result = self.user_persistence_service.check_status_invitations(teams_token=teams_token,
                                                                                       user_mail=idinfo.get("email"))
                if status_result['success'] is False:
                    return {
                        'is_success': True,
                        'status': status_result['error']
                    }
                owner_id = status_result['team_owner_id']
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
        user_object = self.add_user(is_without_card=is_without_card, customer_id=customer_id, user_form=google_payload,
                                    spi=auth_google_data.spi)
        if teams_token:
            self.publish_email_notification(user_object.email, NotificationTitles.TEAM_MEMBER_ADDED.value, params=None)
            notification_id = self.save_account_notification(self, user_object.id, NotificationTitles.TEAM_MEMBER_ADDED.value)
            self.send_member_notification(owner_id, NotificationTitles.TEAM_MEMBER_ADDED.value, notification_id)
            self.user_persistence_service.update_teams_owner_id(user_id=user_object.id, teams_token=teams_token,
                                                                owner_id=owner_id)
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
        self.user_persistence_service.email_confirmed(user_object.id)
        if not user_object.is_with_card:
            return {
                'status': SignUpStatus.FILL_COMPANY_DETAILS,
                'token': token,
            }
        logger.info("Token created")
        return {
            'status': status,
            'token': token,
        }

    def get_user_authorization_information(self, user: Users, subscription_service: SubscriptionService):
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
            self.user_persistence_service.set_last_signed_in(user_id=user_object.id)
            if user_object.team_owner_id:
                token_info = {
                    "id": user_object.team_owner_id,
                    "team_member_id": user_object.id
                }
                user_object = self.user_persistence_service.get_user_by_id(user_object.team_owner_id, True)
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
        teams_token = user_form.teams_token
        owner_id = None
        status = SignUpStatus.NEED_CHOOSE_PLAN
        if teams_token:
            status = SignUpStatus.SUCCESS
            status_result = self.user_persistence_service.check_status_invitations(teams_token=teams_token,
                                                                                   user_mail=user_form.email)
            if status_result['success'] is False:
                return {
                    'is_success': True,
                    'status': status_result['error']
                }
            owner_id = status_result['team_owner_id']
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
        user_form.password = get_password_hash(user_form.password.strip())
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
        if user_form.spi:
            status = SignUpStatus.SUCCESS
        user_object = self.add_user(is_without_card=is_without_card, customer_id=customer_id, user_form=user_data,
                                    spi=user_form.spi)
        if teams_token:
            self.publish_email_notification(user_object.email, NotificationTitles.TEAM_MEMBER_ADDED.value, params=None)
            notification_id = self.save_account_notification(self, user_object.id, NotificationTitles.TEAM_MEMBER_ADDED.value.value)
            self.send_member_notification(owner_id, NotificationTitles.TEAM_MEMBER_ADDED.value, notification_id)
            self.user_persistence_service.update_teams_owner_id(user_id=user_object.id, teams_token=teams_token,
                                                                owner_id=owner_id)
            token_info = {
                "id": owner_id,
                "team_member_id": user_object.id
            }
        else:
            token_info = {
                "id": user_object.id
            }
        token = create_access_token(token_info)
        logger.info("Token created")
        if is_without_card and teams_token is None:
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
                'token': token
            }

        logger.info("Token created")
        return {
            'is_success': True,
            'status': status,
            'token': token
        }

    def login_account(self, login_form: UserLoginForm):
        email = login_form.email
        password = login_form.password
        user_object = self.user_persistence_service.get_user_by_email(email)
        if not user_object:
            return {'status': LoginStatus.INCORRECT_PASSWORD_OR_EMAIL}
        if not user_object.password:
            return {'status': LoginStatus.INCORRECT_PASSWORD_OR_EMAIL}
        if user_object:
            check_password = verify_password(password, user_object.password)
            if check_password:
                logger.info("Password verification passed")
                self.user_persistence_service.set_last_signed_in(user_id=user_object.id)
                if user_object.team_owner_id:
                    token_info = {
                        "id": user_object.team_owner_id,
                        "team_member_id": user_object.id
                    }
                    user_object = self.user_persistence_service.get_user_by_id(user_object.team_owner_id, True)
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
                if check_user_object.get('team_owner_id'):
                    token_info = {
                        "id": check_user_object.get('team_owner_id'),
                        "team_member_id": check_user_object.get('id')
                    }
                else:
                    token_info = {
                        "id": check_user_object.get('id'),
                    }
                user_token = create_access_token(token_info)
                return {
                    'status': VerifyToken.EMAIL_ALREADY_VERIFIED,
                    'user_token': user_token
                }
            self.user_persistence_service.email_confirmed(check_user_object.get('id'))
            if check_user_object.get('team_owner_id'):
                token_info = {
                    "id": check_user_object.get('team_owner_id'),
                    "team_member_id": check_user_object.get('id')
                }
            else:
                token_info = {
                    "id": check_user_object.get('id'),
                }
            user_token = create_access_token(token_info)
            return {
                'status': VerifyToken.SUCCESS,
                'user_token': user_token
            }
        return {'status': VerifyToken.INCORRECT_TOKEN}

    def reset_password(self, reset_password_form: ResetPasswordForm):
        if reset_password_form:
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
