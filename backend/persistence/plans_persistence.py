from sqlalchemy.orm import Session

from models.plans import SubscriptionPlan
from models.subscriptions import UserSubscriptions
from models.users import User


class PlansPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_stripe_plans(self, period):
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True, SubscriptionPlan.interval == period).all()

    def get_trial_status_by_user_id(self, user_id: int):
        subscription = self.db.query(UserSubscriptions).filter(UserSubscriptions.user_id == user_id).first()
        if subscription is not None:
            return subscription.is_trial
        return None

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
        leads_credits = plan.leads_credits
        prospect_credits = plan.prospect_credits
        members_limit = plan.members_limit
        return domains_limit, users_limit, integrations_limit, leads_credits, prospect_credits, members_limit

    def get_free_trail_plan(self):
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.is_free_trial == True).first()
    def get_current_price(self, user_id):
        price = self.db.query(SubscriptionPlan.price).join(
            UserSubscriptions,
            UserSubscriptions.plan_id == SubscriptionPlan.id
        ).filter(
            UserSubscriptions.user_id == user_id
        ).order_by(
            UserSubscriptions.id.desc()
        ).limit(1).scalar()
        return price

    def get_user_subscription(self, user_id):
        return self.db.query(UserSubscriptions).filter(
            UserSubscriptions.user_id == user_id
        ).order_by(
            UserSubscriptions.id.desc()
        ).first()
    
    def get_plan_price(self, price_id):
        price = self.db.query(SubscriptionPlan.price).filter(
            SubscriptionPlan.stripe_price_id == price_id).scalar()
        return price

    def get_current_plan(self, user_id):
        subscription_plan = self.db.query(SubscriptionPlan).join(
            UserSubscriptions,
            UserSubscriptions.plan_id == SubscriptionPlan.id
        ).filter(
            UserSubscriptions.user_id == user_id
        ).order_by(
            UserSubscriptions.plan_end.desc()
        ).first()
        return subscription_plan

    def get_plan_info(self, user_id):
            return self.db.query(UserSubscriptions).filter(UserSubscriptions.user_id == user_id).first()
