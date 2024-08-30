from sqlalchemy.orm import Session

from models.plans import SubscriptionPlan
from models.subscriptions import UserSubscriptions


class PlansPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_stripe_plans(self):
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    
    def get_trial_status_by_user_id(self, user_id: int):
        return self.db.query(UserSubscriptions).filter_by(user_id=user_id).first().is_trial

    def get_plan_by_title(self, title: str):
        plan = self.db.query(SubscriptionPlan).filter(SubscriptionPlan.title == title).first()
        if plan:
            return plan.id
        else:
            return None

    def get_plan_limit_by_id(self, plan_id: int):
        plan = self.db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
        domains_limit = plan.domains_limit
        users_limit = plan.users_limit
        integrations_limit = plan.integrations_limit
        audiences_limit = plan.audiences_limit
        return domains_limit, users_limit, integrations_limit, audiences_limit

    def get_free_trail_plan(self):
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.is_free_trial == True).first()
