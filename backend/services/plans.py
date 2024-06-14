import logging

from ..models.plans import SubscriptionPlan, UserSubscriptionPlan
from ..services import subscriptions

logger = logging.getLogger(__name__)
TRIAL_STUB_PLAN_ID = 17
WITHOUT_CARD_PLAN_ID = 15

def set_default_plan(db, user_id: int, is_trial: bool):
    try:
        user_subscription_id = None
        default_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_default == True).first()
        user_subscription = subscriptions.get_subscription(db, user_id)
        if user_subscription:
            user_subscription_id = user_subscription.id
        plan_object = UserSubscriptionPlan(user_id=user_id, plan_id=default_plan.id, is_trial=is_trial, subscription_id=user_subscription_id)
        db.add(plan_object)
        db.commit()
        return default_plan
    except Exception as e:
        db.rollback()
        return False


def set_plan_without_card(db, user_id):
    try:
        user_subscription_id = None
        plan_without_card = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == WITHOUT_CARD_PLAN_ID).first()
        user_subscription = subscriptions.get_subscription(db, user_id)
        if user_subscription:
            user_subscription_id = user_subscription.id
        plan_object = UserSubscriptionPlan(user_id=user_id, plan_id=plan_without_card.id, is_trial=True, subscription_id=user_subscription_id)
        db.add(plan_object)
        db.commit()
        return plan_without_card
    except Exception as e:
        db.rollback()
        return False