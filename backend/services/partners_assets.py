import logging
import os
from fastapi import HTTPException, UploadFile
from urllib.parse import urlparse
import requests
from enums import PartnersAssetsInfoEnum
from persistence.partners_asset_persistence import PartnersAssetPersistence, PartnersAsset
from schemas.partners_asset import PartnersAssetResponse

logger = logging.getLogger(__name__)


class PartnersAssetService:

    def __init__(self, partners_asset_persistence: PartnersAssetPersistence):
        self.partners_asset_persistence = partners_asset_persistence

    def get_assets(self):
        assets = self.partners_asset_persistence.get_assets()
        return [
            self.domain_mapped(asset)
            for i, asset in enumerate(assets)
        ]
    

    def delete_asset(self, id: int):
        if id:
            try:
                self.partners_asset_persistence.delete_asset(asset_id=id)
                return PartnersAssetsInfoEnum.SUCCESS
            except Exception as err:
                logger.debug('Error deleting assets file', err)
                return PartnersAssetsInfoEnum.NOT_FOUND
        else:
            return PartnersAssetsInfoEnum.NOT_VALID_ID


    async def update_asset(self, asset_id: int, description: str, file: UploadFile = None):
        updating_data = {"description": description}

        if file:
            file_contents = await file.read()
            updating_data["file_url"] = "https://milkhail-scrapping-nfluencers.s3.eu-west-1.amazonaws.com/clients_requests/2274644ac7b0ca83af842bbf0f4d59d8.zip"
            updating_data["preview_url"] = "https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg"
 
        updated_data = self.partners_asset_persistence.update_asset(asset_id, updating_data)

        if not updated_data:
            raise HTTPException(status_code=404, detail="Asset not found")

        return self.domain_mapped(updated_data)


    async def create_asset(self, description: str, type: str, file: UploadFile = None):
        if(file):
            file_contents = await file.read()
        creating_data = {
            "description": description, 
            "type": type, 
            "file_url": "https://milkhail-scrapping-nfluencers.s3.eu-west-1.amazonaws.com/clients_requests/2274644ac7b0ca83af842bbf0f4d59d8.zip",
            "preview_url": "https://images.hdqwalls.com/download/sunset-tree-red-ocean-sky-7w-3840x2160.jpg"
        }

        created_data = self.partners_asset_persistence.create_data(creating_data)

        if not created_data:
            raise HTTPException(status_code=404, detail="Asset not found")

        return self.domain_mapped(created_data)


    def get_file_size(self, file_url: str) -> str:
        if file_url:
            try:
                response = requests.head(file_url, allow_redirects=True, timeout=5)
                if response.status_code == 200 and 'Content-Length' in response.headers:
                    size_in_bytes = int(response.headers['Content-Length'])
                    size_in_mb = size_in_bytes / (1024 ** 2)
                    return f"{size_in_mb:.2f} MB"
                else:
                    return "0.00 MB"
            except Exception as err:
                logger.debug('Error fetching file size', err)
                return "0.00 MB" 
        else:
            return "0.00 MB"


    def get_file_extension(self, file_url) -> str:
        if file_url:
            url_path = urlparse(file_url).path
            extension = os.path.splitext(url_path)[-1][1:].capitalize()
            if not extension:
                return "Unknown"
            return extension
        else: 
            return "Unknown"


    def domain_mapped(self, asset: PartnersAsset):
        return PartnersAssetResponse(
            id=asset.id,
            title=asset.title,
            type=asset.type,
            preview_url=asset.preview_url,
            file_url=asset.file_url,
            file_extension=self.get_file_extension(asset.file_url),
            file_size=self.get_file_size(asset.file_url),
        ).model_dump()