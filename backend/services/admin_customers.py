from sqlalchemy import func
from config.stripe import StripeConfig
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from models.plans import SubscriptionPlan
from models.subscriptions import UserSubscriptions
from models.users import Users
import logging

from services.subscriptions import SubscriptionService

logger = logging.getLogger(__name__)


class AdminCustomersService:

    def __init__(self, db: Session, subscription_service: SubscriptionService):
        self.db = db
        self.subscription_service = subscription_service

    def get_user_by_email(self, email):
        user_object = self.db.query(Users).filter(func.lower(Users.email) == func.lower(email)).first()
        return user_object

    def get_user_subscription(self, user_id):
        user_subscription = self.db.query(UserSubscriptions).filter(UserSubscriptions.user_id == user_id).first()
        return user_subscription

    def get_free_trial_plan(self):
        free_trial_plan = self.db.query(SubscriptionPlan).filter(SubscriptionPlan.is_free_trial == True).first()
        return free_trial_plan

    def get_default_plan(self):
        default_plan = self.db.query(SubscriptionPlan).filter(SubscriptionPlan.is_default == True).first()
        return default_plan

    def update_book_call(self, user_id, url):
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.is_book_call_passed: True, Users.stripe_payment_url: url},
            synchronize_session=False)
        self.db.commit()

    def create_customer_session(self, price_id: str, customer_id: str):
        return self.create_stripe_checkout_session(
            success_url=StripeConfig.success_url,
            cancel_url=StripeConfig.cancel_url,
            customer_id=customer_id,
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription"
        )

    def create_stripe_checkout_session(self, success_url: str, cancel_url: str, customer_id: str,
                                       line_items: List[dict],
                                       mode: str):
        import stripe

        session = stripe.checkout.Session.create(
            success_url=success_url, cancel_url=cancel_url, allow_promotion_codes=True, customer=customer_id,
            payment_method_types=["card"], line_items=line_items, mode=mode
        )
        return {"link": session.url}

    def set_user_subscription(self, user_id, plan_start, plan_end):
        (
            self.db.query(UserSubscriptions)
            .filter(Users.id == user_id)
            .update(
                {UserSubscriptions.plan_start: plan_start, UserSubscriptions.plan_end: plan_end},
                synchronize_session=False,
            )
        )
        self.db.commit()

    def confirmation_customer(self, email, free_trial):
        user_data = self.get_user_by_email(email)
        link = ''
        if free_trial:
            self.subscription_service.update_user_payment_status(user_id=user_data.id, is_success=True)
            user_subscription = self.subscription_service.create_subscription_from_free_trial(user_id=user_data.id)
            self.subscription_service.create_new_usp_free_trial(user_data.id, user_subscription.id)
        else:
            link = self.create_customer_session(self.get_default_plan().stripe_price_id, user_data.customer_id)['link']
        self.update_book_call(user_data.id, link)
        
        return user_data


    def set_pixel_installed(self, mail):
        (
            self.db.query(Users)
            .filter(Users.email == mail)
            .update(
                {Users.is_pixel_installed: True},
                synchronize_session=False,
            )
        )
        self.db.commit()

    def pixel_code_passed(self, mail):
        user_data = self.get_user_by_email(mail)
        if user_data:
            if not user_data.is_pixel_installed:
                self.set_pixel_installed(mail)
                user_subscription = self.get_user_subscription(user_data.id)
                if not user_subscription.plan_start and not user_subscription.plan_end:
                    free_trial_plan = self.get_free_trial_plan()
                    start_date = datetime.utcnow()
                    end_date = start_date + timedelta(days=free_trial_plan.trial_days)
                    start_date_str = start_date.isoformat() + "Z"
                    end_date_str = end_date.isoformat() + "Z"
                    self.set_user_subscription(user_data.id, start_date_str, end_date_str)
                    return 'OK'
                else:
                    return 'The time of the plan is already set'
            else:
                return 'pixel is installed'
        else:
            return 'Undefined user'

