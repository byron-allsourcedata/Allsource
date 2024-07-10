from sqlalchemy.orm import Session

from models.plans import SubscriptionPlan, UserSubscriptionPlan


class PlansPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_stripe_plans(self):
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
