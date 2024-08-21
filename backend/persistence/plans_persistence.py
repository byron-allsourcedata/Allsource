from sqlalchemy.orm import Session

from models.plans import SubscriptionPlan, UserSubscriptionPlan


class PlansPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_stripe_plans(self):
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    
    def get_trial_status_by_user_id(self, user_id: int):
        try:
            return self.db.query(UserSubscriptionPlan).filter_by(user_id=user_id).order_by(UserSubscriptionPlan.created_at.desc()).first().is_trial
        except:
            return False
