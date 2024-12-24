from datetime import datetime, timezone
from models.partners import Partners
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
import re
from typing import Optional


class PartnersPersistence:

    def __init__(self, db: Session):
        self.db = db


    def get_partners(self):
        return self.db.query(Partners).all()
    

    def get_asset_by_id(self, partner_id):
        return self.db.query(Partners).filter(Partners.id == partner_id).first()
    

    def update_partner(self, partner_id: int, commission: int) -> Optional[Partners]:
        partner = self.get_asset_by_id(partner_id)

        if not partner:
            return None

        partner.commission = commission

        self.db.commit()
        self.db.refresh(partner)
        return partner
    

    def terminate_partner(self, partner_id):
        self.db.query(Partners).filter(
            Partners.id == partner_id).delete()
        self.db.commit()


    def create_partner(self, creating_data: dict) -> Optional[Partners]:
        partner = Partners(
            user_id=creating_data["user_id"],
            commission=creating_data["commission"],
        )

        self.db.add(partner)
        self.db.commit()
        self.db.refresh(partner)
        return partner