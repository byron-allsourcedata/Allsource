from models.partners_asset import PartnersAsset
from sqlalchemy.orm import Session
from typing import Optional


class PartnersAssetPersistence:

    def __init__(self, db: Session):
        self.db = db


    def get_assets(self):
        return self.db.query(PartnersAsset).all()
    

    def get_asset_by_id(self, asset_id):
        return self.db.query(PartnersAsset).filter(PartnersAsset.id == asset_id).first()


    def delete_asset(self, asset_id):
        asset = self.get_asset_by_id(asset_id)
        self.db.delete(asset)
        self.db.commit()

    
    def update_asset(self, asset_id: int, updating_data: dict) -> Optional[PartnersAsset]:
        asset = self.get_asset_by_id(asset_id)

        if not asset:
            return None

        asset.title = updating_data["description"]
        if "file_url" in updating_data:
            asset.file_url = updating_data["file_url"]
        if "preview_url" in updating_data:
            asset.file_url = updating_data["preview_url"]

        self.db.commit()
        self.db.refresh(asset)
        return asset
    

    def create_data(self, creating_data: dict) -> Optional[PartnersAsset]:
        asset = PartnersAsset(
            title=creating_data["description"],
            type=creating_data["type"],
            file_url=creating_data["file_url"],
            preview_url=creating_data["preview_url"],
        )

        self.db.add(asset)
        self.db.commit()
        self.db.refresh(asset)
        return asset