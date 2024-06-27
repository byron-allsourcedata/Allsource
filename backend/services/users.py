from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from ..enums import SignUpStatus, StripePaymentStatusEnum, AutomationSystemTemplate
from ..models.send_grid_template import SendGridTemplate
from ..models.users import Users
import logging
import os
from typing import Optional
import stripe
from ..services import plans
from ..schemas.users import UserSignUpForm
from ..services.auth import create_access_token, get_password_hash
from ..services.sendgrid import SendGridHandler
from sqlalchemy.orm import Session
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy.orm import sessionmaker

logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

class ServiceUsers:
    def __init__(self, db: Session):
        self.db = db

    def get_template_id(self, alias):
        template = self.db.query(SendGridTemplate).filter(SendGridTemplate.alias == alias).first()
        if template:
            return template.template_id
        return None

    def get_user(self, email):
        user_object = self.db.query(Users).filter(func.lower(Users.email) == func.lower(email)).first()
        return user_object

    def get_utc_aware_date(self):
        return datetime.now(timezone.utc).replace(microsecond=0)

    def get_utc_aware_date_for_mssql(self, delta: timedelta = timedelta(seconds=0)):
        date = self.get_utc_aware_date()
        if delta:
            date += delta
        return date.isoformat()[:-6] + "Z"

    def update_user_parent_v2(self, parent_id: int):
        self.db.query(Users).filter(Users.id == parent_id).update({Users.parent_id: parent_id},
                                                                  synchronize_session=False)

    def google_email_confirmed_for_non_cc(self, db, user_id: int):
        query = db.query(Users).filter(Users.id == user_id)
        if query:
            db.query(Users).filter(Users.id == user_id).update({"email_confirmed": True})
            db.commit()

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
            payment_status=StripePaymentStatusEnum.PENDING.value,
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

    def create_account_google(self, user_form: UserSignUpForm, is_without_card):
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
        self.update_user_parent_v2(user_object.get("user_filed_id"))
        token = create_access_token(user_object)
        response.update({"token": token})
        logger.info("Token created")
        self.google_email_confirmed_for_non_cc(user_object.get("user_filed_id"))
        user_plan = plans.set_default_plan(self.db, user_object.get("user_filed_id"), False)
        if not user_plan:
            return {
                'status': SignUpStatus.NOT_VALID_EMAIL
            }
        logger.info(f"Set plan {user_plan.title} for new user")
        logger.info("Token created")
        return {
            'status': SignUpStatus.SUCCESS,
            'token': token
        }

    def create_account(self, user_form: UserSignUpForm, is_without_card):
        response = {}
        user_form.password = get_password_hash(user_form.password)
        check_user_object = self.get_user(user_form.email)
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
        self.update_user_parent_v2(user_object.get("user_filed_id"))
        token = create_access_token(user_object)
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
            user_plan = plans.set_default_plan(self.db, user_object.get("user_filed_id"), True)
            return {
                'status': SignUpStatus.NEED_CONFIRM_EMAIL,
                'token': token
            }
        else:
            user_plan = plans.set_default_plan(self.db, user_object.get("user_filed_id"), False)
        logger.info(f"Set plan {user_plan.title} for new user")
        logger.info("Token created")
        return {
            'status': SignUpStatus.SUCCESS,
            'token': token
        }
