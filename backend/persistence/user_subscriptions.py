from sqlalchemy import select

from db_dependencies import Db
from models import UserSubscriptions, Users
from resolver import injectable


@injectable
class UserSubscriptionsPersistence:
    def __init__(self, db: Db):
        self.db = db

    def add(self, user_id: int, plan_id: int):
        user_subscription = UserSubscriptions(user_id=user_id, plan_id=plan_id)

        self.db.add(user_subscription)
        return user_subscription

    def set_current_subscription(self, user_id: int, subscription_id: int):
        user = self.db.execute(
            select(Users).where(Users.id == user_id)
        ).scalar()
        user.current_subscription_id = subscription_id
        self.db.add(user)
