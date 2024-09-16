import logging
import stripe
from typing import List
from config.stripe import StripeConfig
from services.plans import PlansService
from enums import SubscriptionStatus

logger = logging.getLogger(__name__)


class PaymentsService:

    def __init__(self, plans_service: PlansService):
        self.plans_service = plans_service

    def get_additional_credits_price_id(self):
        return self.plans_service.get_additional_credits_price_id()

    def create_customer_session(self, price_id: str):
        return self.create_stripe_checkout_session(
            success_url=StripeConfig.success_url,
            cancel_url=StripeConfig.cancel_url,
            customer_id=self.plans_service.get_customer_id(),
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription"
        )

    def get_user_subscription_authorization_status(self):
        return self.plans_service.get_user_subscription_authorization_status()
    
    def cancel_user_subscripion(self):
        subscription_id = self.plans_service.get_subscription_id()
        subscription_data = stripe.Subscription.cancel(subscription_id)
        if subscription_data['status'] == 'canceled':
            return SubscriptionStatus.SUCCESS
        else:
            return SubscriptionStatus.UNKNOWN
    
    def upgrade_and_downgrade_user_subscription(self, price_id: str) -> str:
        subscription_id = self.plans_service.get_subscription_id()
        subscription = stripe.Subscription.retrieve(subscription_id)
        subscription_item_id = subscription['items']['data'][0]['id']
        is_downgrade = self.is_downgrade(price_id)
        if is_downgrade:
            stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
            new_subscription_data = stripe.Subscription.create(
                customer=self.plans_service.get_customer_id(),
                items=[{
                    'price': price_id,
                }],
                proration_behavior='none'
            )
            return self.get_subscription_status(new_subscription_data['id'])
        
        else:
            subscription_data = stripe.Subscription.modify(
                subscription_id,
                items=[{
                    'id': subscription_item_id,
                    'price': price_id,
                }],
                proration_behavior='create_prorations'
            )
            return self.get_subscription_status(subscription_data['id'])

    def is_downgrade(self, price_id: str) -> bool:
        current_price = self.plans_service.get_current_price()
        new_price = self.plans_service.get_plan_price(price_id)
        return self.compare_prices(new_price, current_price) < 0

    def compare_prices(self, price_id1: str, price_id2: str) -> int:
        return price_id1 - price_id2

    def get_subscription_status(self, subscription_id: str) -> str:
        subscription = stripe.Subscription.retrieve(subscription_id)
        status = subscription['status']
        if status == 'active':
            return SubscriptionStatus.SUCCESS
        elif status == 'incomplete':
            return SubscriptionStatus.INCOMPLETE
        elif status == 'past_due':
            return SubscriptionStatus.PAST_DUE
        elif status == 'canceled':
            return SubscriptionStatus.CANCELED
        else:
            return SubscriptionStatus.UNKNOWN


        
    def charge_user_for_extra_credits(self, quantity: int):
        return self.create_stripe_checkout_session(
        success_url=StripeConfig.success_url,
        cancel_url=StripeConfig.cancel_url,
        customer_id=self.plans_service.get_customer_id(),
        line_items=[{"price": self.get_additional_credits_price_id(), "quantity": quantity}],
        mode="payment"
    )

    def create_stripe_checkout_session(self, success_url: str, cancel_url: str, customer_id: str,
                                        line_items: List[dict],
                                        mode: str):
        session = stripe.checkout.Session.create(
            success_url=success_url,
            cancel_url=cancel_url,
            allow_promotion_codes=True,
            customer=customer_id,
            payment_method_types=["card"],
            line_items=line_items,
            mode=mode
        )
        return {"link": session.url}
