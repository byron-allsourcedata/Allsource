from models.partners import Partners
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta


class PartnersPersistence:

    def __init__(self, db: Session):
        self.db = db


    def get_partners(self, isMaster, search_term, start_date, end_date, offset, limit):
        query = self.db.query(Partners).filter(Partners.isMaster == isMaster)

        if search_term:
            query = query.filter(
                (Partners.name.ilike(search_term)) | (Partners.email.ilike(search_term))
            )

        if start_date:
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Partners.join_date >= start_date)

        if end_date:
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1) - timedelta(seconds=1)
            else:
                end_date = datetime.combine(end_date, datetime.max.time())
            query = query.filter(Partners.join_date <= end_date)

        return query.offset(offset).limit(limit).all()

    

    def get_partners_by_partners_id(self, id, start_date=None, end_date=None, offset=None, limit=None):
        query = self.db.query(Partners).filter(Partners.master_id == id)
        
        if start_date:
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Partners.join_date >= start_date)
        if end_date:
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1) - timedelta(seconds=1)
            else:
                end_date = datetime.combine(end_date, datetime.max.time())
            query = query.filter(Partners.join_date <= end_date)
        
        if not offset and not limit:
            return query
        
        return query.offset(offset).limit(limit).all()
    


    def get_total_count(self, isMaster, search_term=None):
        query = self.db.query(Partners).filter(Partners.isMaster == isMaster)

        if search_term:
            query = query.filter(
                (Partners.name.ilike(search_term)) | (Partners.email.ilike(search_term))
            )

        return query.count()
    
    def get_total_count_by_id(self, id, start_date, end_date):
        query = self.db.query(Partners).filter(Partners.master_id == id)

        if start_date:
            if isinstance(start_date, str):
                start_date = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Partners.join_date >= start_date)
        if end_date:
            if isinstance(end_date, str):
                end_date = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1) - timedelta(seconds=1)
            else:
                end_date = datetime.combine(end_date, datetime.max.time())
            query = query.filter(Partners.join_date <= end_date)

        return query.count()



    def get_asset_by_id(self, partner_id):
        return self.db.query(Partners).filter(Partners.id == partner_id).first()
    

    def get_partner_by_email(self, email):
        return self.db.query(Partners).filter(Partners.email == email).first()
    
    def get_partner_by_user_id(self, user_id):
        return self.db.query(Partners).filter(Partners.user_id == user_id).first()
    

    def update_partner_info(self, email, fullName, company):
        partner = self.get_partner_by_email(email)

        partner.name = fullName
        partner.company_name = company
        self.db.commit()
        self.db.refresh(partner)
    

    def update_partner(self, partner_id: int, **kwargs) -> Optional[Partners]:
        partner = self.get_asset_by_id(partner_id)

        if not partner:
            return None

        for key, value in kwargs.items():
            if hasattr(partner, key) and value is not None:
                setattr(partner, key, value)

        if "full_name" in kwargs and kwargs["full_name"] is not None:
            partner.name = kwargs["full_name"]
        if "company_name" in kwargs and kwargs["company_name"] is not None:
            partner.company_name = kwargs["company_name"]

        self.db.commit()
        self.db.refresh(partner)
        return partner
    

    def update_partner_by_email(self, email: int, **kwargs) -> Optional[Partners]:
        partner = self.get_partner_by_email(email)

        if not partner:
            return None

        for key, value in kwargs.items():
            if hasattr(partner, key) and value is not None:
                setattr(partner, key, value)

        self.db.commit()
        self.db.refresh(partner)
        return partner


    def terminate_partner(self, partner_id):
        self.db.query(Partners).filter(
            Partners.id == partner_id).delete()
        self.db.commit()


    def create_partner(self, creating_data: dict) -> Optional[Partners]:
        partner = Partners(
            commission=creating_data["commission"],
            token=creating_data["token"],
            email=creating_data["email"],
            name=creating_data["full_name"],
            company_name=creating_data["company_name"],
            isMaster=creating_data["isMaster"]
        )

        if "masterId" in creating_data and creating_data["masterId"] is not None:
            partner.master_id = creating_data["masterId"]

        self.db.add(partner)
        self.db.commit()
        self.db.refresh(partner)
        return partner