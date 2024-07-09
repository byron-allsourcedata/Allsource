import logging
from datetime import datetime

from .user_persistence_service import UserPersistenceService
from models.subscriptions import Subscription
from sqlalchemy.orm import Session

ACTIVE_STATUSES = ["active", "trialing", "completed"]


class SubscriptionService:
    def __init__(self, db: Session, user_persistence_service: UserPersistenceService):
        self.db = db
        self.user_persistence_service = user_persistence_service


    def get_subscription(self, user_id: int):
        subscription = self.db.query(Subscription).filter(Subscription.user_id == user_id).order_by(
            Subscription.created_at.desc()).first()
        return subscription

    def is_active(sub_status, end_date):
        if sub_status == 'canceled':
            return end_date >= datetime.now()
        else:
            return sub_status in ACTIVE_STATUSES
