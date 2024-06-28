from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session

from .user_persistence_service import UserPersistenceService
from backend.services.payments_plans import PaymentsPlans
from backend.models.users import Users
import logging
from passlib.context import CryptContext
from typing import Dict, Mapping, Union
from jose import jwt
from ..config.auth import AuthConfig
from ..exceptions import TokenError
from ..schemas.auth import Token
from ..enums import SignUpStatus, StripePaymentStatusEnum, AutomationSystemTemplate
from typing import Optional
from ..schemas.users import UserSignUpForm

logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserAuthService:
    def __init__(self, db: Session, plans_service: PaymentsPlans, user_persistence_service: UserPersistenceService):
        self.db = db
        self.plans_service = plans_service
        self.user_persistence_service = user_persistence_service


    def create_access_token(self, token: Token, expires_delta: Union[timedelta, None] = None):
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=AuthConfig.expire_days)

        if isinstance(token, dict):
            token_dict = token
        else:
            token_dict = token.__dict__

        token_dict.update({"exp": int(expire.timestamp())})
        encoded_jwt = jwt.encode(token_dict, AuthConfig.secret_key, AuthConfig.algorithm)
        return encoded_jwt

    def verify_password(self, plain_password, hashed_password):
        return pwd_context.verify(plain_password, hashed_password)

    def decode_jwt_from_headers(self, headers: dict) -> Mapping:
        """
        Extracts Authorization Bearer JWT from request header and decodes it.
        Works for both Flask and FastAPI.
        :param headers: header dictionary (Flask) or Header Object (FastAPI)
        :return: decoded jwt data
        """
        return self.decode_jwt_data(headers.get("Authorization", ""))

    # def decode_jwt_data(self, token: str) -> Union[Mapping, Dict]:
    #     """
    #     Decodes data from JWT.
    #     :param token: Bearer JWT
    #     :return: decoded jwt data
    #     """
    #     try:
    #         token = token.replace("Bearer ", "")
    #     except AttributeError:
    #         raise TokenError
    #     jwt_data = jwt.decode(token, options={"verify_signature": False}, audience="Filed-Client-Apps",
    #                           algorithms=["HS256"])
    #     return jwt_data

    def get_utc_aware_date(self):
        return datetime.now(timezone.utc).replace(microsecond=0)

    def get_utc_aware_date_for_mssql(self, delta: timedelta = timedelta(seconds=0)):
        date = self.get_utc_aware_date()
        if delta:
            date += delta
        return date.isoformat()[:-6] + "Z"

    def get_password_hash(self, password):
        return pwd_context.hash(password)

    def add_user(self, customer_id: str, user_form: Optional[dict] = None, google_token: Optional[dict] = None):
        user_object = Users(
            email=user_form.email if google_token is None or len(google_token) == 0 else google_token.get("email"),
            email_confirmed=False,
            password=user_form.password,
            full_name=user_form.full_name if google_token is None or len(google_token) == 0 else google_token.get("full_name"),
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
            "user_filed_id": user_object.id,
            "email": user_object.email,
            "full_name": user_object.full_name,
            "iss": "Filed-Token-Issuer",
            "user_account_state": user_object.payment_status,
            "aud": "Filed-Client-Apps",
            "permissions_filed": "5A^1|82^7c02|BE^7f",
            "sub_user": False,
            "parent_user_id": user_object.id,
            "customer_id": user_object.customer_id,
            "company_name": user_object.company
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
                "full_name": f"{idinfo.get("given_name")} {idinfo.get("family_name")}",
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

    def create_account(self, user_form: UserSignUpForm):
        response = {}
        user_form.password = self.get_password_hash(user_form.password)
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
        token = self.create_access_token(user_object)
        response.update({"token": token})
        logger.info("Token created")
        if is_without_card:
            confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/authentication/verify-token?token={token}&skip_pricing=true"
            mail_object = SendGridHandler()
            mail_object.send_sign_up_mail(
                subject="Please Verify Your Email Address",
                to_emails=user_object.email,
                template_id=self.get_template_id(AutomationSystemTemplate.EMAIL_VERIFICATION_TEMPLATE),
                template_placeholder={"Full_name": user_object.full_name, "Link": confirm_email_url},
            )
            logger.info("Confirmation Email Sent")
            user_plan = self.plans_service.set_default_plan(self.db, user_object.get("user_filed_id"), True)
            return {
                'status': SignUpStatus.NEED_CONFIRM_EMAIL,
                'token': token
            }
        else:
            user_plan = self.plans_service.set_default_plan(user_object.get("user_filed_id"), False)
            logger.info(f"Set plan {user_plan.title} for new user")
        logger.info("Token created")
        return {
            'status': SignUpStatus.NEED_CHOOSE_PLAN,
            'token': token
        }
