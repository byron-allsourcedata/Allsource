from models.users import User
from sqlalchemy.orm import Session


class SettingsPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_my_details(self, user: User):
        return self.db.query(User).filter(User.id == user.id).first()
