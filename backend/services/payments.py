import logging
from datetime import datetime
from typing import List

from httpx import Client
import stripe

from config.stripe import StripeConfig
from enums import SubscriptionStatus
from persistence.plans_persistence import PlansPersistence
from services.plans import PlansService
from .stripe_service import renew_subscription, get_default_payment_method, purchase_product, \
    cancel_subscription_at_period_end, cancel_downgrade, create_stripe_checkout_session
from .subscriptions import SubscriptionService

stripe.api_key = StripeConfig.api_key
logger = logging.getLogger(__name__)


def manage_subscription_schedule(current_subscription, platform_subscription_id, price_id):
    if current_subscription.get("schedule"):
        subscription_schedule_id = current_subscription['schedule']
        schedule = stripe.SubscriptionSchedule.retrieve(subscription_schedule_id)
        stripe.SubscriptionSchedule.release(schedule.id)

    schedule = stripe.SubscriptionSchedule.create(
        from_subscription=platform_subscription_id,
    )

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

    return schedule_downgrade_subscription


def get_subscription_status(subscription) -> str:
    status = subscription['status']
    if status == 'active':
        return SubscriptionStatus.SUCCESS.value
    elif status == 'incomplete':
        return SubscriptionStatus.INCOMPLETE.value
    elif status == 'past_due':
        return SubscriptionStatus.PAST_DUE.value
    elif status == 'canceled':
        return SubscriptionStatus.CANCELED.value
    else:
        return SubscriptionStatus.UNKNOWN.value


def compare_prices(price_id1: int, price_id2: int) -> int:
    return price_id1 - price_id2


class PaymentsService:

    def __init__(self, plans_service: PlansService, plan_persistence: PlansPersistence,
                 subscription_service: SubscriptionService):
        self.plans_service = plans_service
        self.plan_persistence = plan_persistence
        self.subscription_service = subscription_service

    def upgrade_subscription(self, current_subscription, platform_subscription_id, price_id):
        if current_subscription['schedule']:
            self.upgrade_subscription_scheduled(current_subscription)
        return {'status': self.upgrade_subscription_immediate(current_subscription, platform_subscription_id, price_id)}

    def upgrade_subscription_immediate(self, current_subscription, platform_subscription_id, price_id):
        upgrade_subscription = stripe.Subscription.modify(
            platform_subscription_id,
            cancel_at_period_end=False,
            items=[
                {"id": current_subscription.get("items").get("data")[0].get("id"), "deleted": True},
                {"price": price_id}
            ],
            proration_behavior='none',
            billing_cycle_anchor='now',
            trial_end='now'
        )
        return get_subscription_status(upgrade_subscription)

    def upgrade_subscription_scheduled(self, current_subscription):
        schedule = stripe.SubscriptionSchedule.retrieve(current_subscription.get("schedule"))
        stripe.SubscriptionSchedule.release(schedule.id)

    def create_customer_session(self, price_id: str, user):
        customer_id = self.plans_service.get_customer_id(user)
        trial_period = 0
        if not self.plan_persistence.get_user_subscription(user.get('id')):
            trial_period = self.plan_persistence.get_plan_by_price_id(price_id).trial_days
        if get_default_payment_method(customer_id):
            status_subscription = renew_subscription(price_id, customer_id, trial_period)
            return {"status_subscription": status_subscription}
        return create_stripe_checkout_session(
            customer_id=self.plans_service.get_customer_id(user),
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            trial_period=trial_period
        )

    def get_user_subscription_authorization_status(self):
        return self.plans_service.get_user_subscription_authorization_status()

    def downgrade_subscription(self, current_subscription, platform_subscription_id, price_id, subscription):
        schedule_downgrade_subscription = manage_subscription_schedule(current_subscription,
                                                                       platform_subscription_id, price_id)
        self.plans_service.save_downgrade_price_id(price_id, subscription)
        return {'status': get_subscription_status(schedule_downgrade_subscription)}

    def cancel_user_subscription(self, user, reason_unsubscribe):
        subscription = self.plan_persistence.get_user_subscription(user_id=user.get('id'))
        if not subscription:
            return SubscriptionStatus.SUBSCRIPTION_NOT_FOUND
        subscription_data = cancel_subscription_at_period_end(subscription.platform_subscription_id)
        if subscription_data['status'] == 'active':
            cancel_at = subscription_data.get('canceled_at')
            cancel_scheduled_at = datetime.fromtimestamp(cancel_at)
            self.plans_service.save_reason_unsubscribe(reason_unsubscribe, user.get('id'), cancel_scheduled_at)
            return SubscriptionStatus.SUCCESS
        else:
            return SubscriptionStatus.UNKNOWN

    def upgrade_and_downgrade_user_subscription(self, price_id: str, user) -> dict[str, SubscriptionStatus] | dict[
        str, str] | dict[str, str]:
        subscription = self.plan_persistence.get_user_subscription(user_id=user.get('id'))
        if subscription is None:
            return {'status': SubscriptionStatus.INCOMPLETE}
        platform_subscription_id = subscription.platform_subscription_id
        current_subscription = stripe.Subscription.retrieve(platform_subscription_id)
        is_downgrade = self.is_downgrade(price_id, user.get('current_subscription_id'))
        plan = self.plan_persistence.get_plan_by_price_id(price_id)
        if user.get("awin_awc"):
            with Client() as client:
                try:
                    
                    client.get(f'https://www.awin1.com/sread.php?a=107427&b={plan.price}&cr=USD&c=AW&d=SUBCRIPRION:{plan.price}&vc=&t=0&ch=aw&cks={user.get("awin_awc")}')
                except:
                    ...
        if is_downgrade:
            return self.downgrade_subscription(current_subscription, platform_subscription_id, price_id, subscription)
        else:
            return self.upgrade_subscription(current_subscription, platform_subscription_id, price_id)

    def cancel_downgrade(self, user: dict):
        subscription = self.plan_persistence.get_user_subscription(user_id=user.get('id'))
        if not subscription:
            return SubscriptionStatus.SUBSCRIPTION_NOT_FOUND
        subscription_data = cancel_downgrade(subscription.platform_subscription_id)
        if subscription_data == 'SUCCESS':
            self.subscription_service.cancellation_downgrade(subscription.id)

        return SubscriptionStatus.SUCCESS

    def is_downgrade(self, price_id: str, current_subscription_id: int) -> bool:
        current_price = self.plans_service.get_current_price(current_subscription_id).priority
        new_price = self.plans_service.get_plan_price(price_id).priority
        return compare_prices(new_price, current_price) < 0

    def charge_user_for_extra_credits(self, quantity: int, users):
        customer_id = self.plans_service.get_customer_id(users)
        try:
            purchase_product(customer_id, self.plans_service.get_additional_credits_price_id(), quantity,
                             'prospect_credits')
            return {"status": "PAYMENT_SUCCESS"}
        except Exception as e:
            return create_stripe_checkout_session(
                customer_id=customer_id,
                line_items=[{"price": self.plans_service.get_additional_credits_price_id(), "quantity": quantity}],
                mode="payment"
            )
