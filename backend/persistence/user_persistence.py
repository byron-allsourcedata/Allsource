from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session
from models.users import Users
import logging

logger = logging.getLogger(__name__)


class UserPersistence:
    def __init__(self, db: Session):
        self.db = db

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
