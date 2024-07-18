from sqlalchemy import func
from config.stripe import StripeConfig
from typing import List
from sqlalchemy.orm import Session
from models.users import Users
import logging

logger = logging.getLogger(__name__)


class AdminCustomersService:

    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email):
        user_object = self.db.query(Users).filter(func.lower(Users.email) == func.lower(email)).first()
        return user_object

    def update_book_call(self, user_id, url):
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.is_book_call_passed: True, Users.stripe_payment_url: url},
            synchronize_session=False)
        self.db.commit()

    def create_customer_session(self, price_id: str, customer_id: str):
        trial_period = 7
        return self.create_stripe_checkout_session(
            success_url=StripeConfig.success_url,
            cancel_url=StripeConfig.cancel_url,
            customer_id=customer_id,
            line_items=[{"price": price_id, "quantity": 1}],
            trial_period_days=trial_period,
            mode="subscription"
        )

    def create_stripe_checkout_session(self, success_url: str, cancel_url: str, customer_id: str,
                                       line_items: List[dict],
                                       mode: str, trial_period_days: int):
        import stripe

        if trial_period_days:
            session = stripe.checkout.Session.create(
                success_url=success_url,
                cancel_url=cancel_url,
                allow_promotion_codes=True,
                customer=customer_id,
                payment_method_types=["card"],
                line_items=line_items,
                mode=mode,
                subscription_data={
                    "trial_settings": {"end_behavior": {"missing_payment_method": "cancel"}},
                    "trial_period_days": trial_period_days,
                },
            )
        else:
            session = stripe.checkout.Session.create(
                success_url=success_url, cancel_url=cancel_url, allow_promotion_codes=True, customer=customer_id,
                payment_method_types=["card"], line_items=line_items, mode=mode
            )
        return {"link": session.url}

    def confirmation_customer(self, email):
        user_data = self.get_user_by_email(email)
        link = self.create_customer_session('price_1PawtHRw2DIFYsXeAfWfuK0A', user_data.customer_id)['link']
        self.update_book_call(user_data.id, link)
        return 'OK'
