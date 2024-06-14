import logging
from datetime import datetime
from ..models.subscriptions import Subscription
from ..services import users

logger = logging.getLogger(__name__)
ACTIVE_STATUSES = ["active", "trialing", "completed"]


def get_subscription(db, user_id: int):
    subscription = db.query(Subscription).filter(Subscription.user_id == user_id).order_by(
        Subscription.created_at.desc()).first()
    if subscription is None:
        sub_user = users.get_user_by_id(db=db, user_id=user_id)
        subscription = db.query(Subscription).filter(Subscription.user_id == sub_user.parent_id).order_by(
            Subscription.created_at.desc()).first()
    return subscription


def is_active(sub_status, end_date):
    if sub_status == 'canceled':
        return end_date >= datetime.now()
    else:
        return sub_status in ACTIVE_STATUSES
