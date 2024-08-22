from sqlalchemy.orm import Session
from models.klaviyo_users import KlaviyoUsers


class KlaviyoPersistence:

    def __init__(self, db: Session):
        self.db = db

    def save_klaviyo_users(self, klaviyo_user: dict):
        new_klaviyo_user = KlaviyoUsers(**klaviyo_user)
        self.db.add(new_klaviyo_user)
        self.db.commit()
        return new_klaviyo_user
