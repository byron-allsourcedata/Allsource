from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.models.send_grid_template import SendGridTemplate
from backend.models.users import Users


class UserPersistenceService:
    def __init__(self, db: Session):
        self.db = db

    def get_template_id(self, alias):
        template = self.db.query(SendGridTemplate).filter(SendGridTemplate.alias == alias).first()
        if template:
            return template.template_id
        return None

    def get_user(self, email):
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

    def google_email_confirmed_for_non_cc(self, db, user_id: int):
        query = db.query(Users).filter(Users.id == user_id)
        if query:
            db.query(Users).filter(Users.id == user_id).update({"email_confirmed": True})
            db.commit()