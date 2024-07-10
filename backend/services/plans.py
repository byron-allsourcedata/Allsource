import logging
from sqlalchemy.orm import Session
from models.users import Users
from persistence.plans_persistence import PlansPersistence
from models.plans import SubscriptionPlan, UserSubscriptionPlan
from services.subscriptions import SubscriptionService

logger = logging.getLogger(__name__)
TRIAL_STUB_PLAN_ID = 17
WITHOUT_CARD_PLAN_ID = 15


class PlansService:

    def __init__(self, user: Users, plans_persistence: PlansPersistence,
                 subscription_service: SubscriptionService):
        self.plans_persistence = plans_persistence
        self.user = user
        self.subscription_service = subscription_service

    def get_customer_id(self):
        return self.user.customer_id

    def is_had_trial_period(self):
        return not self.subscription_service.is_had_trial_period(self.user.id)



    def get_subscription_plans(self):
        stripe_plans = self.plans_persistence.get_stripe_plans()
        response = {"stripe_plans": []}
        for stripe_plan in stripe_plans:
            response["stripe_plans"].append(
                {
                    "interval": stripe_plan.interval,
                    "price": stripe_plan.price,
                    "trial_days": stripe_plan.trial_days,
                    "title": stripe_plan.title,
                    "description": stripe_plan.description,
                    "stripe_price_id": stripe_plan.stripe_price_id,
                    "currency": stripe_plan.currency,
                }
            )
        return response
