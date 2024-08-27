from .subscriptions import SubscriptionService
from persistence.user_persistence import UserPersistence
from models.plans import SubscriptionPlan
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)
WITHOUT_CARD_PLAN_ID = 15


class PaymentsPlans:
    def __init__(self, db: Session, subscription_service: SubscriptionService,
                 user_persistence_service: UserPersistence):
        self.db = db
        self.subscription_service = subscription_service
        self.user_persistence_service = user_persistence_service
