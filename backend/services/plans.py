import logging

from enums import UserAuthorizationStatus
from persistence.plans_persistence import PlansPersistence
from services.subscriptions import SubscriptionService

logger = logging.getLogger(__name__)
TRIAL_STUB_PLAN_ID = 17
WITHOUT_CARD_PLAN_ID = 15


class PlansService:

    def __init__(self, plans_persistence: PlansPersistence,
                 subscription_service: SubscriptionService):
        self.plans_persistence = plans_persistence
        self.subscription_service = subscription_service

    def get_customer_id(self, user):
        return user.get('customer_id')

    def is_had_trial_period(self, user):
        return not self.subscription_service.is_had_trial_period(user.get('id'))

    def get_user_subscription_authorization_status(self, user):
        if not user.get('is_with_card'):
            if not user.get('is_email_confirmed'):
                return UserAuthorizationStatus.NEED_CONFIRM_EMAIL
            if not user.get('is_company_details_filled'):
                return UserAuthorizationStatus.FILL_COMPANY_DETAILS
        return UserAuthorizationStatus.SUCCESS
    
    def get_additional_credits_price_id(self):
        return self.subscription_service.get_additional_credits_price_id()
    
    def save_reason_unsubscribe(self, reason_unsubscribe, user_id, cancel_scheduled_at):
        self.plans_persistence.save_reason_unsubscribe(reason_unsubscribe, user_id, cancel_scheduled_at)

    def get_subscription_plans(self, period, user):
        stripe_plans = self.plans_persistence.get_stripe_plans(period)
        current_plan = self.plans_persistence.get_current_plan(user_id=user.get('id'))
        user_subscription = self.plans_persistence.get_user_subscription(user_id=user.get('id'))
        response = {"stripe_plans": []}
        plan_order = ["Starter", "Pro", "Growth"]
        stripe_plans.sort(key=lambda plan: plan_order.index(plan.title) if plan.title in plan_order else len(plan_order))
        for stripe_plan in stripe_plans:
            is_active = (current_plan.title  == stripe_plan.title and user_subscription.status == 'active' and current_plan.interval == stripe_plan.interval) if current_plan and user_subscription else False
            response["stripe_plans"].append(
                {
                    "interval": stripe_plan.interval,
                    "price": stripe_plan.price,
                    "title": stripe_plan.title,
                    "description": stripe_plan.description,
                    "stripe_price_id": stripe_plan.stripe_price_id,
                    "currency": stripe_plan.currency,
                    "domains_limit": stripe_plan.domains_limit,
                    "integrations_limit": stripe_plan.integrations_limit,
                    "leads_credits": stripe_plan.leads_credits,
                    "prospect_credits": stripe_plan.prospect_credits,
                    "features": stripe_plan.features,
                    "is_active": is_active
                }
            )
        return response

    def get_subscription_by_price_id(self, price_id):
        return self.subscription_service.get_subscription_by_price_id(price_id)
    
    def save_downgrade_price_id(self, price_id, subscription):
        self.subscription_service.save_downgrade_price_id(price_id, subscription)
    
    def get_current_price(self, user_id):
        return self.plans_persistence.get_current_price(user_id=user_id)
    
    def get_plan_price(self, price_id):
        return self.plans_persistence.get_plan_price(price_id=price_id)
