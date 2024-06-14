from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from ..enums import StripePaymentStatusEnum
from ..models.users import Users
import logging
import os
from typing import Optional
import stripe
from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from ..services import plans
from ..enums import SubscriptionsCodes
from ..schemas.users import SignIn, UserSignUpForm
from ..services.auth import create_access_token, decode_jwt_data, \
    verify_password
# from templates import create_default_templates
from .sendgrid import SendGridHandler
# from ..config.sendgrid import SendgridConfigBase

logger = logging.getLogger(__name__)

def create_account(user_form: UserSignUpForm, db):
    google_payload = {}
    response = {}
    payment_version = getattr(user_form, 'payment_version', 0)
    is_special_offer = getattr(user_form, 'special_offer', False)
    is_without_card = getattr(user_form, 'is_without_card', False)
    user_form_token = getattr(user_form, 'token', None)
    CLIENT_ID = os.getenv("CLIENT_ID")
    logger.info(CLIENT_ID)
    if user_form_token is not None:
        google_request = google_requests.Request()
        idinfo = id_token.verify_oauth2_token(user_form.token, google_request, CLIENT_ID)
        if idinfo:
            google_payload = {
                "first_name": idinfo.get("given_name"),
                "username": idinfo.get("email"),
                "last_name": idinfo.get("family_name"),
                "iss": user_form.iss,
            }
            user_form.email = idinfo.get("email")
            user_form.name = idinfo.get("given_name")
        else:
            return {
                'is_success': False,
                'error': 'Google authentication failed',
                'data': None
            }

    check_user_object = get_user(db, user_form.email)
    if check_user_object is not None:
        logger.info(f"User already exists in database with email: {user_form.email}")
        return {
            'is_success': False,
            'data': None,
            'error': 'User by this username already exists'
        }
    customer_object = stripe.Customer.create(
        email=user_form.email,
        description="User form web app signup form)",
        name=f"{user_form.first_name} {user_form.last_name}",
    )
    customer_id = customer_object.get("id")
    user_object = add_user(db, customer_id, user_form, google_payload)

    if user_object is None:
        return {
            'is_success': False,
            'error': 'Failed to create user account',
            'data': None
        }
    update_user_parent_v2(db, user_object.get("user_filed_id"))
    token = create_access_token(user_object)
    response.update({"token": token})
    logger.info("Token created")
    confirm_email_url = f"{os.getenv('SITE_HOST_URL')}/authentication/verify-token?token={token}&skip_pricing=true"
    if is_without_card:
        if is_without_card.token:
            google_email_confirmed_for_non_cc(db, user_object.get("user_filed_id"))
        else:
            # mail_object = SendGridHandler()
            # mail_object.send_signup_mail(
            #     subject="Please Verify Your Email Address",
            #     to_emails=[user_object.get("email")],
            #     template_id=SendgridConfigBase.email_verification_template_id,
            #     template_placeholder={"Firstname": user_object.get("user_firstname"), "Link": confirm_email_url},
            # )
            logger.info("Confirmation Email Sent")
        user_plan = plans.set_plan_without_card(db, user_object.get("user_filed_id"))
    else:
        user_plan = plans.set_default_plan(db, user_object.get("user_filed_id"), True)

    logger.info(f"Set plan {user_plan.title} for new user")
    logger.info("Token created")
    if payment_version == "app_v2":
        if not is_without_card:
            stripe_session_data = {
                "success_url": os.getenv("STRIPE_SUCCESS_REDIRECT_URI"),
                "cancel_url": os.getenv("STRIPE_FAILURE_REDIRECT_URI"),
                "customer": customer_id,
                "payment_method_types": ["card"],
                "line_items": [{"price": user_plan.stripe_price_id, "quantity": 1}],
                "mode": "subscription",
            }
            if is_special_offer:
                stripe_session_data["discounts"] = [{"coupon": user_plan.coupon_id}]
            else:
                stripe_session_data["allow_promotion_codes"] = True
            if user_plan.trial_days is not None:
                stripe_session_data["subscription_data"] = {
                    "trial_settings": {"end_behavior": {"missing_payment_method": "cancel"}},
                    "trial_period_days": user_plan.trial_days,
                }
            payment_link_generation = stripe.checkout.Session.create(**stripe_session_data)
            payment_link = payment_link_generation.urler(db, customer_id, user_form, google_payload)

    if user_object is None:
        response.update({"paymentLink": payment_link})
    return {
        'is_success': True,
        'error': None,
        'data': response
    }


def get_user(db, email):
    user_object = db.query(Users).filter(func.lower(Users.email) == func.lower(email)).first()
    return user_object

def get_user_by_id(db, user_id: int):
    return db.query(Users).filter(Users.id == user_id).first()

def add_user(db, customer_id: str, user_form: Optional[dict] = None, google_token: Optional[dict] = None):
    try:
        user_object = Users(
            email=user_form.email if len(google_token) == 0 else google_token.get("email"),
            email_confirmed=False,
            password=user_form.password,
            first_name=user_form.first_name if len(google_token) == 0 else google_token.get("first_name"),
            last_name=user_form.last_name if len(google_token) == 0 else google_token.get("last_name"),
            image=user_form.image,
            company=user_form.company if user_form.company is not None else user_form.first_name,
            created_at=get_utc_aware_date_for_mssql(),
            last_login=get_utc_aware_date_for_mssql(),
            #payment_status=StripePaymentStatusEnum.PENDING.value if user_form.payment_version == "app_v2" else StripePaymentStatusEnum.ONGOING.value,
            parent_id=0,
            customer_id=customer_id,
            website=user_form.website,
            #companylogo=user_form.companylogo,
        )
        db.add(user_object)
        db.commit()
        token_info = {
            "user_filed_id": user_object.id,
            "email": user_object.email,
            "user_firstname": user_object.first_name,
            "user_lastname": user_object.last_name,
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
    except Exception as e:
        print("Exception:", e)
        db.rollback()
        return False


def get_utc_aware_date():
    return datetime.now(timezone.utc).replace(microsecond=0)


def get_utc_aware_date_for_mssql(delta: timedelta = timedelta(seconds=0)):
    date = get_utc_aware_date()
    if delta:
        date += delta
    return date.isoformat()[:-6] + "Z"


def update_user_parent_v2(db, parent_id: int):
    db.query(Users).filter(Users.id == parent_id).update({Users.parent_id: parent_id}, synchronize_session=False)


def get_google_user(db, google_payload):
    user_object = db.query(Users).filter(Users.username == google_payload.get("username"),
                                         Users.password == google_payload.get("password")).first()
    return user_object


def google_email_confirmed_for_non_cc(db, user_id: int):
    query = db.query(Users).filter(Users.id == user_id)
    if query:
        db.query(Users).filter(Users.id == user_id).update({"email_confirmed": True})
        db.commit()
