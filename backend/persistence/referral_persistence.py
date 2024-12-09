from sqlalchemy.orm import Session
from sqlalchemy import update, or_
from sqlalchemy.orm import aliased
from models.users import Users


class ReferralPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_stripe_info_by_id(self, user_id):
        user = self.db.query(Users).filter(Users.id == user_id).first()
        result_user = None
        if user:
            result_user = {
                'connected_stripe_account_id': user.connected_stripe_account_id
            }
        self.db.rollback()
        return result_user


