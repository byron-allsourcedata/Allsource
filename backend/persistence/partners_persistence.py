from models.partners import Partners
from sqlalchemy.orm import Session
from typing import Optional


class PartnersPersistence:

    def __init__(self, db: Session):
        self.db = db


    def get_partners(self, isMaster, start_date, end_date, offset, limit):
        query = self.db.query(Partners).filter(Partners.isMaster == isMaster)

        if start_date:
            query = query.filter(Partners.join_date >= start_date)
        if end_date:
            query = query.filter(Partners.join_date <= end_date)

        return query.offset(offset).limit(limit).all()
    

    def get_partners_by_partners_id(self, id):
        return self.db.query(Partners).filter(Partners.master_id == id).all()
    

    def get_partners_search(self, isMaster, search_term, start_date, end_date, offset, limit):
        query = self.db.query(Partners).filter(
            (Partners.isMaster == isMaster) & 
            ((Partners.name.ilike(search_term)) | (Partners.email.ilike(search_term)))
        )
    
        if start_date:
            query = query.filter(Partners.join_date >= start_date)
        if end_date:
            query = query.filter(Partners.join_date <= end_date)

        return query.offset(offset).limit(limit).all()


    def get_total_count(self, isMaster):
        return self.db.query(Partners).filter(Partners.isMaster == isMaster).count()


    def get_total_count_search(self, isMaster, search_term):
        return self.db.query(Partners).filter(
            (Partners.isMaster == isMaster) &
            ((Partners.name.ilike(search_term)) | (Partners.email.ilike(search_term)))
        ).count()


    def get_asset_by_id(self, partner_id):
        return self.db.query(Partners).filter(Partners.id == partner_id).first()
    

    def get_partner_by_email(self, email):
        return self.db.query(Partners).filter(Partners.email == email).first()
    

    def update_partner(self, partner_id: int, **kwargs) -> Optional[Partners]:
        partner = self.get_asset_by_id(partner_id)

        if not partner:
            return None

        for key, value in kwargs.items():
            if hasattr(partner, key) and value is not None:
                setattr(partner, key, value)

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

        self.db.add(partner)
        self.db.commit()
        self.db.refresh(partner)
        return partner