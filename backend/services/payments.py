import logging
from typing import List
from config.stripe import StripeConfig
from services.plans import PlansService

logger = logging.getLogger(__name__)


class PaymentsService:

    def __init__(self, plans_service: PlansService):
        self.plans_service = plans_service

    def create_customer_session(self, price_id: str):
        return self.create_stripe_checkout_session(
            success_url=StripeConfig.success_url,
            cancel_url=StripeConfig.cancel_url,
            customer_id=self.plans_service.get_customer_id(),
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

    def get_user_subscription_authorization_status(self):
        self.plans_service.get_user_subscription_authorization_status()
