from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session

from models.plans import UserSubscriptionPlan, SubscriptionPlan
from models.users import Users
from models.subscriptions import UserSubscriptions
import logging

logger = logging.getLogger(__name__)


class UserPersistence:
    def __init__(self, db: Session):
        self.db = db

    def user_plan_info_db(self, user_id):
        return self.db.query(UserSubscriptionPlan, SubscriptionPlan).join(SubscriptionPlan,
                                                                          UserSubscriptionPlan.plan_id == SubscriptionPlan.id).filter(
            UserSubscriptionPlan.user_id == user_id).order_by(UserSubscriptionPlan.id.desc()).first()

    def set_reset_password_sent_now(self, user_id: int):
        send_message_expiration_time = datetime.now()
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.reset_password_sent_at: send_message_expiration_time},
            synchronize_session=False)
        self.db.commit()

    def set_verified_email_sent_now(self, user_id: int):
        send_message_expiration_time = datetime.now()
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.verified_email_sent_at: send_message_expiration_time},
            synchronize_session=False)
        self.db.commit()

    def get_user_plan(self, user_id: int):
        user_plan = self.db.query(
            UserSubscriptionPlan.is_trial,
            UserSubscriptions.plan_end
        ).join(
            UserSubscriptions,
            UserSubscriptionPlan.subscription_id == UserSubscriptions.id
        ).filter(
            UserSubscriptionPlan.user_id == user_id,
            UserSubscriptions.is_cancelled == 'false'
        ).first()
        if user_plan:
            return {
                "is_trial": user_plan.is_trial,
                "plan_end": user_plan.plan_end
            }
        else:
            return {
                "is_trial": False,
                "plan_end": None
            }

    def get_user_by_email(self, email):
        user_object = self.db.query(Users).filter(func.lower(Users.email) == func.lower(email)).first()
        return user_object

    def get_user_by_id(self, user_id):
        user = self.db.query(Users).filter(Users.id == user_id).first()
        if user:
            return user
        return None

    def update_user_parent_v2(self, parent_id: int):
        self.db.query(Users).filter(Users.id == parent_id).update({Users.parent_id: parent_id},
                                                                  synchronize_session=False)
        self.db.commit()

    def email_confirmed(self, user_id: int):
        query = self.db.query(Users).filter(Users.id == user_id)
        if query:
            self.db.query(Users).filter(Users.id == user_id).update({"is_email_confirmed": True})
            self.db.commit()

    def update_password(self, user_id: int, password: str):
        self.db.query(Users).filter(Users.id == user_id).update({Users.password: password},
                                                                synchronize_session=False)
        self.db.commit()

    def get_users(self):
        return self.db.query(Users).all()