from models.users_domains import UserDomains
from sqlalchemy.orm import Session
from sqlalchemy import func

class UserDomainsPersistence:

    def __init__(self, db: Session):
        self.db = db

    def get_domain_by_user(self, user_id: int, **filter_by):
        return self.db.query(UserDomains).filter_by(user_id=user_id, **filter_by).all()

    def create_domain(self, user_id: int, data: dict):
        domain = UserDomains(user_id=user_id, **data)
        self.db.add(domain)
        self.db.commit()
        return domain
    
    def count_domain(self, user_id: int):
        return self.db.query(func.count(UserDomains.id)).filter_by(user_id=user_id).scalar()