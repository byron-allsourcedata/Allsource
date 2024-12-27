from models.partners import Partners
from sqlalchemy.orm import Session
from typing import Optional


class PartnersPersistence:

    def __init__(self, db: Session):
        self.db = db


    def get_partners(self):
        return self.db.query(Partners).all()
    

    def get_asset_by_id(self, partner_id):
        return self.db.query(Partners).filter(Partners.id == partner_id).first()
    

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
    
    def get_asset_by_email(self, email):
        return self.db.query(Partners).filter(Partners.email == email).first()
    

    def update_partner_by_email(self, email: int, **kwargs) -> Optional[Partners]:
        partner = self.get_asset_by_email(email)

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
        )

        self.db.add(partner)
        self.db.commit()
        self.db.refresh(partner)
        return partner