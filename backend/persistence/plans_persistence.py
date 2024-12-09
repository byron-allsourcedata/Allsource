from sqlalchemy.orm import Session
from sqlalchemy import case
from models.plans import SubscriptionPlan
from models.subscriptions import UserSubscriptions
from models.users import User


class PlansPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_stripe_plans(self):
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()

    def save_reason_unsubscribe(self, reason_unsubscribe, user_id, cancel_scheduled_at):
        subscription = self.get_user_subscription(user_id)
        subscription.downgrade_price_id = None
        subscription.downgrade_at = None
        subscription.cancellation_reason = reason_unsubscribe
        subscription.cancel_scheduled_at = cancel_scheduled_at
        self.db.commit()
        
    def cancel_subscription(self, reason_unsubscribe, user_id, time):
        subscription = self.get_user_subscription(user_id)
        subscription.cancellation_reason = reason_unsubscribe
        subscription.plan_end = time
        self.db.commit()

    def get_trial_status_by_user_id(self, user_id: int):
        subscription = self.db.query(UserSubscriptions).filter(UserSubscriptions.user_id == user_id).first()
        if subscription is not None:
            return subscription.is_trial
        return None

    def get_plan_by_title(self, title: str, interval: str):
        plan = self.db.query(SubscriptionPlan).filter(SubscriptionPlan.title == title,
                                                      SubscriptionPlan.interval == interval).first()
        if plan:
            return plan
        else:
            return None

    def get_plan_limit_by_id(self, price_id: int):
        plan = self.db.query(SubscriptionPlan).filter(SubscriptionPlan.stripe_price_id == price_id).first()
        domains_limit = plan.domains_limit
        integrations_limit = plan.integrations_limit
        leads_credits = plan.leads_credits
        prospect_credits = plan.prospect_credits
        members_limit = plan.members_limit
        lead_credit_price = plan.lead_credit_price
        return domains_limit, integrations_limit, leads_credits, prospect_credits, members_limit, lead_credit_price

    def get_free_trail_plan(self):
        return self.db.query(SubscriptionPlan).filter(SubscriptionPlan.is_free_trial == True).first()

    def get_current_price(self, current_subscription_id):
        subscription_plan = self.db.query(SubscriptionPlan).join(
            UserSubscriptions,
            UserSubscriptions.plan_id == SubscriptionPlan.id
        ).filter(
            UserSubscriptions.id == current_subscription_id
        ).first()
        return subscription_plan

    def get_user_subscription(self, user_id):
        return self.db.query(
            UserSubscriptions
        ).join(User, User.current_subscription_id == UserSubscriptions.id).filter(
            User.id == user_id
        ).first()

    def get_user_subscription_with_trial_status(self, user_id):
        result = (
            self.db.query(UserSubscriptions, SubscriptionPlan.is_free_trial, SubscriptionPlan.trial_days, SubscriptionPlan.currency, SubscriptionPlan.price)
            .join(User, User.current_subscription_id == UserSubscriptions.id)
            .join(SubscriptionPlan, SubscriptionPlan.id == UserSubscriptions.plan_id)
            .filter(User.id == user_id)
            .first()
        )

        return result

    def get_plan_by_price_id(self, price_id):
        subscription_plan = self.db.query(SubscriptionPlan).filter(
            SubscriptionPlan.stripe_price_id == price_id).first()
        return subscription_plan

    def get_current_plan(self, user_id):
        return self.db.query(SubscriptionPlan).join(
            UserSubscriptions, UserSubscriptions.plan_id == SubscriptionPlan.id).join(
            User, User.current_subscription_id == UserSubscriptions.id).filter(User.id == user_id).first()
