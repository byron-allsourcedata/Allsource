from sqlalchemy.orm import Session

from models.plans import SubscriptionPlan
from models.subscriptions import UserSubscriptions


class PlansPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_stripe_plans(self):
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    
    def get_trial_status_by_user_id(self, user_id: int):
        try:
            return self.db.query(UserSubscriptions).filter_by(user_id=user_id).order_by(UserSubscriptions.created_at.desc()).first().is_trial
        except:
            return False

    def get_plan_by_title(self, title: str):
        return self.db.query(SubscriptionPlan).filter_by(title=title).first()
