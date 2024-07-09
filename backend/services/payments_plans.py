import logging

from .subscriptions import SubscriptionService
from .user_persistence_service import UserPersistenceService
from models.plans import SubscriptionPlan, UserSubscriptionPlan
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)
WITHOUT_CARD_PLAN_ID = 15


class PaymentsPlans:
    def __init__(self, db: Session, subscription_service: SubscriptionService,
                 user_persistence_service: UserPersistenceService):
        self.db = db
        self.subscription_service = subscription_service
        self.user_persistence_service = user_persistence_service

    def set_default_plan(self, user_id: int, is_trial: bool):
        user_subscription_id = None
        default_plan = self.db.query(SubscriptionPlan).filter(SubscriptionPlan.is_default == True).first()
        user_subscription = self.subscription_service.get_subscription(user_id)
        if user_subscription:
            user_subscription_id = user_subscription.id
        plan_object = UserSubscriptionPlan(user_id=user_id, plan_id=default_plan.id, is_trial=is_trial,
                                           subscription_id=user_subscription_id)
        self.db.add(plan_object)
        self.db.commit()
        return default_plan

    def set_plan_without_card(self, user_id):
        try:
            user_subscription_id = None
            plan_without_card = self.db.query(SubscriptionPlan).filter(
                SubscriptionPlan.id == WITHOUT_CARD_PLAN_ID).first()
            user_subscription = self.subscription_service.get_subscription(user_id)
            if user_subscription:
                user_subscription_id = user_subscription.id
            plan_object = UserSubscriptionPlan(user_id=user_id, plan_id=plan_without_card.id, is_trial=True,
                                               subscription_id=user_subscription_id)
            self.db.add(plan_object)
            self.db.commit()
            return plan_without_card
        except Exception as e:
            self.db.rollback()
            return False

    def check_user_plan(self, user_id):
        logger.info(f"call check_user_plan for user_id = {user_id}")
        user_plan_obj = self.db.query(UserSubscriptionPlan).filter(UserSubscriptionPlan.user_id == user_id).first()
        if user_plan_obj is None:
            self.set_default_plan(user_id, True)
