import logging
from sqlalchemy.orm import Session

from models.users import Users
from persistence.plans_persistence import PlansPersistence
from models.plans import SubscriptionPlan

logger = logging.getLogger(__name__)
TRIAL_STUB_PLAN_ID = 17
WITHOUT_CARD_PLAN_ID = 15


class PlansService:

    def __init__(self, user: Users, db: Session, plans_persistence: PlansPersistence):
        self.db = db
        self.user_persistence_service = plans_persistence

    def get_subscription_plans(self):
        stripe_plans = self.get_stripe_plans()
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

    def get_stripe_plans(self):
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
