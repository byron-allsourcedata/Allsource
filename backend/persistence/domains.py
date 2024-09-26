from models.users_domains import UserDomains
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
import re
class UserDomainsPersistence:

    def __init__(self, db: Session):
        self.db = db


    def get_domain_by_user(self, user_id: int, domain_substr: str = None):
        query = self.db.query(UserDomains).filter_by(user_id=user_id)
        if domain_substr:
            query = query.filter(UserDomains.domain.like(f"%{domain_substr}%"))
        return query.all()

    def get_domain_by_filter(self, **filter_by):
        return self.db.query(UserDomains).filter_by(**filter_by).all()

    def normalize_domain(self, domain: str) -> str:
        domain = re.sub(r'^https?:\/\/', '', domain) 
        domain = re.sub(r'^www\.', '', domain) 
        return domain

    def create_domain(self, user_id, data: dict):
        normalized_domain = self.normalize_domain(data.get('domain'))
        existing_domains = self.db.query(UserDomains).filter(UserDomains.user_id == user_id).all()
        for existing_domain in existing_domains:
            if self.normalize_domain(existing_domain.domain) == normalized_domain:
                raise HTTPException(status_code=409, detail={'status': 'Domain already exists'})
        domain = UserDomains(user_id=user_id, domain=data['domain'])
        self.db.add(domain)
        self.db.commit()
        return domain

    
    def count_domain(self, user_id: int):
        return self.db.query(func.count(UserDomains.id)).filter_by(user_id=user_id).scalar()
    

    def delete_domain(self, user_id: int, domain: int):
        domain = self.db.query(UserDomains).filter(UserDomains.user_id == user_id, UserDomains.id == domain).first()
        if not domain:
            raise HTTPException(status_code=404, detail={'status': 'NOT_FOUND'})
        self.db.delete(domain)
        self.db.commit()