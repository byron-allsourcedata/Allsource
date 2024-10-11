import logging
import stripe
from typing import List
from config.stripe import StripeConfig
from services.plans import PlansService
from .stripe_service import renew_subscription, get_default_payment_method, purchase_product
from enums import SubscriptionStatus

stripe.api_key = StripeConfig.api_key
logger = logging.getLogger(__name__)


class PaymentsService:

    def __init__(self, plans_service: PlansService):
        self.plans_service = plans_service

    def get_additional_credits_price_id(self):
        return self.plans_service.get_additional_credits_price_id()

    def create_customer_session(self, price_id: str, users):
        customer_id = self.plans_service.get_customer_id(users)
        if get_default_payment_method(customer_id):
            status_subscription = renew_subscription(price_id, customer_id).status
            return {"status_subscription": status_subscription}
        return self.create_stripe_checkout_session(
            success_url=StripeConfig.success_url,
            cancel_url=StripeConfig.cancel_url,
            customer_id=self.plans_service.get_customer_id(users),
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription"
        )

    def get_user_subscription_authorization_status(self):
        return self.plans_service.get_user_subscription_authorization_status()
    
    def cancel_user_subscripion(self, user, reason_unsubscribe):
        subscription = self.plans_service.get_subscription(user)
        if not subscription:
            return SubscriptionStatus.SUBSCRIPTION_NOT_FOUND
        if subscription.status == 'canceled':
            return SubscriptionStatus.SUBSCRIPTION_ALREADY_CANCELED
        subscription_data = stripe.Subscription.cancel(subscription.platform_subscription_id)
        if subscription_data['status'] == 'canceled':
            self.plans_service.save_reason_unsubscribe(reason_unsubscribe, user.get('id'))
            return SubscriptionStatus.SUCCESS
        else:
            return SubscriptionStatus.UNKNOWN
    
    def upgrade_and_downgrade_user_subscription(self, price_id: str, users) -> str:
        import time
        from datetime import datetime, timedelta
        subscription = self.plans_service.get_subscription(users)
        if subscription is None:
            return SubscriptionStatus.INCOMPLETE
        subscription_id = subscription.platform_subscription_id
        subscription = stripe.Subscription.retrieve(subscription_id)
        subscription_item_id = subscription['items']['data'][0]['id']
        is_downgrade = self.is_downgrade(price_id, users.get('id'))
        desired_start_date = datetime.utcnow() + timedelta(days=30)
        billing_cycle_anchor = int(time.mktime(desired_start_date.timetuple()))
        if is_downgrade:
            stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
            new_subscription_data = stripe.SubscriptionSchedule.create(
                customer=self.plans_service.get_customer_id(users),
                phases=[
                    {
                        'items': [{
                            'price': subscription.get('items')['data'][0].get('price'),
                            'quantity': 1,
                        }],
                        'start_date': int(subscription.current_period_end),
                        'end_date': None,
                    },
                    {
                        'items': [{
                            'price': price_id,
                            'quantity': 1,
                        }],
                        'start_date': int(subscription.current_period_end) + 30 * 24 * 60 * 60,
                        'end_date': None,
                    },
                ],
            )
            print(subscription.current_period_end)
            print("Status:", new_subscription_data['status'])
            print("Current period start:", new_subscription_data['current_period_start'])
            print("Current period end:", new_subscription_data['current_period_end'])
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

    def is_downgrade(self, price_id: str, user_id: int) -> bool:
        current_price = self.plans_service.get_current_price(user_id)
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


        
    def charge_user_for_extra_credits(self, quantity: int, users):
        customer_id = self.plans_service.get_customer_id(users)
        try:
            purchase_product(customer_id, self.get_additional_credits_price_id(), quantity)
            return {"status": "PAYMENT_SUCCESS"}
        except Exception as e:
            return self.create_stripe_checkout_session(
                success_url=StripeConfig.success_url,
                cancel_url=StripeConfig.cancel_url,
                customer_id=customer_id,
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
