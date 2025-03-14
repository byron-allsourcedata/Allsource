from datetime import datetime, timezone
from models.users_domains import UserDomains
from models.leads_users import LeadUser
from models.leads_users_added_to_cart import LeadsUsersAddedToCart
from models.leads_users_ordered import LeadsUsersOrdered
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, or_
from fastapi import HTTPException
import re


class UserDomainsPersistence:

    def __init__(self, db: Session):
        self.db = db

    def get_domains_by_user(self, user_id: int, domain_substr: str = None):
        query = self.db.query(UserDomains).filter_by(user_id=user_id)
        if domain_substr:
            query = query.filter(UserDomains.domain == domain_substr)
        return query.all()
    

    def get_domain_name(self, domain_id: int):
        query = self.db.query(UserDomains.domain).filter(UserDomains.id == domain_id)
        result = query.first()
    
        return result.domain if result else None


    def get_domains_with_leads(self, user_id: int):
        converted_sales = func.count(case(
            (or_(
                and_(
                    LeadUser.behavior_type != "product_added_to_cart",
                    LeadUser.is_converted_sales == True
                ),
                and_(
                    LeadUser.is_converted_sales == True,
                    LeadUser.behavior_type == "product_added_to_cart",
                    LeadsUsersAddedToCart.added_at < LeadsUsersOrdered.ordered_at
                )
            ), 1),
            else_=None
        ))
        viewed_product = func.count(case(
            (and_(
                LeadUser.behavior_type == "viewed_product",
                LeadUser.is_converted_sales == False
            ), 1),
            else_=None
        ))
        visitor = func.count(case(
            (and_(
                LeadUser.behavior_type == "visitor",
                LeadUser.is_converted_sales == False
            ), 1),
            else_=None
        ))
        abandoned_cart = func.count(case(
            (and_(
                LeadUser.behavior_type == "product_added_to_cart",
                LeadUser.is_converted_sales == False,
                or_(
                    LeadUser.behavior_type == "product_added_to_cart",
                    and_(
                        LeadUser.is_converted_sales == True,
                        LeadsUsersAddedToCart.added_at > LeadsUsersOrdered.ordered_at,
                    )
                )
            ), 1),
            else_=None
        ))

        total_count = converted_sales + viewed_product + visitor + abandoned_cart

        query = (
            self.db.query(
                UserDomains.id,
                UserDomains.domain,
                UserDomains.is_pixel_installed,
                converted_sales,
                viewed_product,
                visitor,
                abandoned_cart,
                total_count
            )
            .outerjoin(LeadUser, UserDomains.id == LeadUser.domain_id)
            .outerjoin(LeadsUsersAddedToCart, LeadsUsersAddedToCart.lead_user_id == LeadUser.id)
            .outerjoin(LeadsUsersOrdered, LeadsUsersOrdered.lead_user_id == LeadUser.id)
            .filter(UserDomains.user_id == user_id)
            .group_by(UserDomains.id, UserDomains.domain)
        )
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
        domain = UserDomains(user_id=user_id, domain=data['domain'],
                             created_at=datetime.now(timezone.utc).replace(tzinfo=None))
        self.db.add(domain)
        self.db.commit()
        return domain

    def count_domain(self, user_id: int):
        return self.db.query(func.count(UserDomains.id)).filter_by(user_id=user_id).scalar()
    
    def update_domain_name(self, domain_id: int, domain_name: str):
        self.db.query(UserDomains).filter(
            UserDomains.id == domain_id
        ).update({UserDomains.domain: domain_name})
        self.db.commit()
    
    def update_first_domain_by_user_id(self, user_id: int, new_domain):
        domain_query = self.db.query(UserDomains).filter(UserDomains.user_id == user_id).first()

        if domain_query:
            domain_query.domain = new_domain
            self.db.commit()

    def delete_domain(self, user_id: int, domain: int):
        domain = self.db.query(UserDomains).filter(UserDomains.user_id == user_id, UserDomains.id == domain).first()
        if not domain:
            raise HTTPException(status_code=404, detail={'status': 'NOT_FOUND'})
        self.db.delete(domain)
        self.db.commit()
    
    def update_pixel_installation(self, domain_id: int, is_pixel_install):
        self.db.query(UserDomains).filter(
            UserDomains.id == domain_id
        ).update({UserDomains.is_pixel_installed: is_pixel_install})
        self.db.commit()
