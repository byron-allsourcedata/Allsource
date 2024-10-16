import logging
import stripe
from typing import List
from config.stripe import StripeConfig
from services.plans import PlansService
from persistence.plans_persistence import PlansPersistence
from .stripe_service import renew_subscription, get_default_payment_method, purchase_product, cancel_subscription_at_period_end
from enums import SubscriptionStatus
from datetime import datetime

stripe.api_key = StripeConfig.api_key
logger = logging.getLogger(__name__)


class PaymentsService:

    def __init__(self, plans_service: PlansService, plan_persistence: PlansPersistence):
        self.plans_service = plans_service
        self.plan_persistence = plan_persistence

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
        subscription = self.plan_persistence.get_user_subscription(user_id=user.get('id'))
        if not subscription:
            return SubscriptionStatus.SUBSCRIPTION_NOT_FOUND
        if subscription.status == 'canceled':
            return SubscriptionStatus.SUBSCRIPTION_ALREADY_CANCELED
        subscription_data = cancel_subscription_at_period_end(subscription.platform_subscription_id)
        if subscription_data['status'] == 'active':
            cancel_at = subscription_data.get('canceled_at')
            cancel_scheduled_at = datetime.fromtimestamp(cancel_at)
            self.plans_service.save_reason_unsubscribe(reason_unsubscribe, user.get('id'), cancel_scheduled_at)
            return SubscriptionStatus.SUCCESS
        else:
            return SubscriptionStatus.UNKNOWN
    
    def upgrade_and_downgrade_user_subscription(self, price_id: str, user) -> str:
        subscription = self.plan_persistence.get_user_subscription(user_id=user.get('id'))
        if subscription is None:
            return {'status': SubscriptionStatus.INCOMPLETE}
        platform_subscription_id = subscription.platform_subscription_id
        current_subscription = stripe.Subscription.retrieve(platform_subscription_id)
        is_downgrade = self.is_downgrade(price_id, user.get('id'))
        if is_downgrade:
            schedule = None
            if current_subscription.get("schedule") is None:
                schedule = stripe.SubscriptionSchedule.create(
                    from_subscription=platform_subscription_id,
                )
            else:
                schedule = stripe.SubscriptionSchedule.retrieve(current_subscription.get("schedule"))
            schedule_downgrade_subscription = stripe.SubscriptionSchedule.modify(
                schedule.id,
                phases=[
                    {
                        'items': [{
                            'price': schedule['phases'][0]['items'][0]['price'],
                            'quantity': schedule['phases'][0]['items'][0]['quantity'],
                        }],
                        'start_date': schedule['phases'][0]['start_date'],
                        'end_date': schedule['phases'][0]['end_date'],
                    },
                    {
                        'items': [{
                            'price': price_id,
                            'quantity': 1,
                        }],
                        'iterations': 1,
                    },
                ],
            )
            self.plans_service.save_downgrade_price_id(price_id, subscription)
            return {'status': self.get_subscription_status(schedule_downgrade_subscription)}
        else:
            upgrade_subscription = stripe.Subscription.modify(
                platform_subscription_id,
                cancel_at_period_end=False,
                items=[
                    { "id": current_subscription.get("items").get("data")[0].get("id"), "deleted": True },
                    { "price": price_id }
                ],
                proration_behavior='none',
                billing_cycle_anchor='now'
            )
            return {'status': self.get_subscription_status(upgrade_subscription)}
            

    def is_downgrade(self, price_id: str, user_id: int) -> bool:
        current_price = self.plans_service.get_current_price(user_id)
        new_price = self.plans_service.get_plan_price(price_id)
        return self.compare_prices(new_price, current_price) < 0

    def compare_prices(self, price_id1: str, price_id2: str) -> int:
        return price_id1 - price_id2

    def get_subscription_status(self, subscription) -> str:
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
            purchase_product(customer_id, self.get_additional_credits_price_id(), quantity, 'prospect_credits')
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
