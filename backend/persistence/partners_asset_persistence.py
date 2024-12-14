from datetime import datetime, timezone
from models.partners_asset import PartnersAsset
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
import re


class PartnersAssetPersistence:

    def __init__(self, db: Session):
        self.db = db


    def get_assets(self):
        return self.db.query(PartnersAsset).all()
    

    def get_asset_by_id(self, asset_id):
        return self.db.query(PartnersAsset).filter(PartnersAsset.id == asset_id).first()


    def delete_asset(self, asset_id):
        self.db.query(PartnersAsset).filter(
            PartnersAsset.id == asset_id).delete()
        self.db.commit()