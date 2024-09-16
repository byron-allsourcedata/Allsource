from models.users import User
from sqlalchemy.orm import Session
from sqlalchemy import update

class SettingsPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_account_details(self, user_id):
        return self.db.query(User).filter(User.id == user_id).first()
    
    def change_columns_data_by_userid(self, changes: dict, user_id: int):
        stmt = update(User).where(User.id == user_id).values(changes)
        self.db.execute(stmt)
        self.db.commit()
            

