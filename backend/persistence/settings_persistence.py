from models.users import User
from models.api_keys import ApiKeys
from sqlalchemy.orm import Session
from sqlalchemy import update
from datetime import datetime
from models.users import Users

class SettingsPersistence:
    def __init__(self, db: Session):
        self.db = db

    def get_account_details(self, user_id):
        return self.db.query(User).filter(User.id == user_id).first()
    
    def change_columns_data_by_userid(self, changes: dict, user_id: int):
        stmt = update(User).where(User.id == user_id).values(changes)
        self.db.execute(stmt)
        self.db.commit()
        
    def set_reset_email_sent_now(self, user_id):
        send_message_expiration_time = datetime.now()
        self.db.query(Users).filter(Users.id == user_id).update(
            {Users.change_email_sent_at: send_message_expiration_time},
            synchronize_session=False)
        self.db.commit()
        
    def get_api_details(self, user_id):
        return self.db.query(
            ApiKeys.api_key,
            ApiKeys.description,
            ApiKeys.created_date,
            ApiKeys.name,
            ApiKeys.id,
            ApiKeys.api_id,
            ApiKeys.last_used_at
        ).filter(ApiKeys.user_id == user_id).all()
    
    def change_columns_data_api_details(self, changes, user_id, api_keys_id):
        stmt = update(ApiKeys).where(
            (ApiKeys.user_id == user_id) & (ApiKeys.id == api_keys_id)
        ).values(changes)

        self.db.execute(stmt)
        self.db.commit()
        
    def delete_data_api_details(self, user_id, api_keys_id):
        self.db.query(ApiKeys).filter(
            ApiKeys.user_id == user_id,
            ApiKeys.id == api_keys_id
        ).delete()
        self.db.commit()
        
    def insert_data_api_details(self, user_id, api_keys_request):
        new_api_key = ApiKeys(
            user_id=user_id,
            api_key=api_keys_request.api_key,
            api_id=api_keys_request.api_id,
            name=api_keys_request.name,
            description=api_keys_request.description,
            created_date=datetime.now()
        )
        self.db.add(new_api_key)
        self.db.commit()
        