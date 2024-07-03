from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from .jwt_service import get_password_hash, create_access_token, verify_password, decode_jwt_data
from .sendgrid import SendGridHandler
from .user_persistence_service import UserPersistenceService
import os
from backend.services.payments_plans import PaymentsPlans
from backend.models.users import Users
import logging
from ..enums import SignUpStatus, StripePaymentStatusEnum, AutomationSystemTemplate, LoginStatus, BaseEnum
from typing import Optional
from ..schemas.users import UserSignUpForm, UserLoginForm

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

    def add_user(self, customer_id: str, user_form: Optional[dict] = None, google_token: Optional[dict] = None):
        user_object = Users(
            email=user_form.email if google_token is None or len(google_token) == 0 else google_token.get("email"),
            email_confirmed=False,
            password=user_form.password,
            full_name=user_form.full_name if google_token is None or len(google_token) == 0 else google_token.get(
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
        self.db.add(user_object)
        self.db.commit()
        token_info = {
            "id": user_object.id,
        }
        return token_info

    def create_account_google(self, user_form: UserSignUpForm):
        response = {}
        CLIENT_ID = os.getenv("CLIENT_ID")
        google_token = '1'
        iss = os.getenv("ISS")
        google_request = google_requests.Request()
        idinfo = id_token.verify_oauth2_token(google_token, google_request, CLIENT_ID)
        if idinfo:
            google_payload = {
                "email": idinfo.get("email"),
                "full_name": f"{idinfo.get('given_name')} {idinfo.get('family_name')}",
                "iss": iss,
            }
            email = idinfo.get("email")
        else:
            return {
                'status': SignUpStatus.NOT_VALID_EMAIL
            }
        check_user_object = self.get_user(email)
        if check_user_object is not None:
            logger.info(f"User already exists in database with email: {email}")
            return {
                'status': SignUpStatus.EMAIL_ALREADY_EXISTS
            }
        customer_object = stripe.Customer.create(
            email=user_form.email,
            description="User form web app signup google form",
            name=f"{user_form.full_name}"
        )
        customer_id = customer_object.get("id")
        payload = None

        user_object = self.add_user(customer_id, payload, google_payload)
        self.user_persistence_service.update_user_parent_v2(user_object.get("user_filed_id"))
        token = self.create_access_token(user_object)
        response.update({"token": token})
        logger.info("Token created")
        self.google_email_confirmed_for_non_cc(user_object.get("user_filed_id"))
        user_plan = self.plans_service.set_default_plan(self.db, user_object.get("user_filed_id"), False)
        if not user_plan:
            return {
                'status': SignUpStatus.NOT_VALID_EMAIL
            }
        logger.info(f"Set plan {user_plan.title} for new user")
        logger.info("Token created")
        return {
            'status': SignUpStatus.NEED_CHOOSE_PLAN,
            'token': token
        }

    def get_template_id(self, template_type: AutomationSystemTemplate) -> str:
        return template_type.value

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
        # customer_object = stripe.Customer.create(
        #     email=user_form.email,
        #     description="User form web app signup form",
        #     name=f"{user_form.full_name}"
        # )
        # customer_id = customer_object.get("id")
        customer_id = '1'
        user_object = self.add_user(customer_id, user_form)
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
                return {
                    'status': BaseEnum.SUCCESS
                }
            self.user_persistence_service.email_confirmed(check_user_object.id)
            return {
                'status': BaseEnum.SUCCESS
            }
        return {
            'status': BaseEnum.FAILURE
        }
