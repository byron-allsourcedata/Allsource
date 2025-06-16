import calendar
from datetime import datetime, timezone

from sqlalchemy import select

from db_dependencies import Db
from models import UserSubscriptions, Users, SubscriptionPlan
from resolver import injectable


def end_of_month(dt: datetime) -> datetime:
    last_day = calendar.monthrange(dt.year, dt.month)[1]
    return dt.replace(
        day=last_day, hour=23, minute=59, second=59, microsecond=999999
    )


@injectable
class UserSubscriptionsPersistence:
    def __init__(self, db: Db):
        self.db = db

    def add(self, user_id: int, plan: SubscriptionPlan):
        now = datetime.now(timezone.utc)
        user_subscription = UserSubscriptions(
            user_id=user_id,
            plan_id=plan.id,
            plan_start=now,
            price_id=plan.stripe_price_id,
            contact_credit_plan_id=plan.contact_credit_plan_id,
            plan_end=None if plan.alias == 'basic' else end_of_month(now)
        )

        self.db.add(user_subscription)
        return user_subscription

    def set_current_subscription(self, user_id: int, subscription_id: int):
        user = self.db.execute(
            select(Users).where(Users.id == user_id)
        ).scalar()
        user.current_subscription_id = subscription_id
        self.db.add(user)
