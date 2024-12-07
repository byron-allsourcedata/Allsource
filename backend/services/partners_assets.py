from fastapi import HTTPException
import uuid
import os
from urllib.parse import urlparse
import requests
from io import StringIO
from enums import SubscriptionStatus
from persistence.partners_asset_persistence import PartnersAssetPersistence, PartnersAsset
from persistence.plans_persistence import PlansPersistence
from schemas.partners_asset import PartnersAssetResponse
from services.subscriptions import SubscriptionService
from utils import normalize_url


class PartnersAssetService:

    def __init__(self, partners_asset_persistence: PartnersAssetPersistence):
        self.partners_asset_persistence = partners_asset_persistence

    def get_assets(self):
        assets = self.partners_asset_persistence.get_assets()
        return [
            self.domain_mapped(asset)
            for i, asset in enumerate(assets)
        ]
    
    def download_asset(self, asset_id):
        if asset_id:

            partners_asset = self.partners_asset_persistence.get_asset_by_id(asset_id=asset_id)

            if not partners_asset or not partners_asset.file_url:
                print("Invalid asset or missing file URL.")
                return False

            try:
                response = requests.get(partners_asset.file_url, stream=True)
                response.raise_for_status()

                url_path = urlparse(partners_asset.file_url).path
                file_extension = os.path.splitext(url_path)[-1]
                filename = f"{partners_asset.title}{file_extension}"
                safe_filename = os.path.join(os.getcwd(), filename)

                with open(safe_filename, 'wb') as file:
                    for chunk in response.iter_content(chunk_size=8192):
                        file.write(chunk)
                print(f"File successfully downloaded: {safe_filename}")
                return True

            except requests.exceptions.RequestException as e:
                print(f"Error downloading file: {e}")
                return False

        print("Invalid asset ID.")
        return False

    # def download_asset(self, asset_id):
    #     if asset_id:

    #         partners_asset = self.partners_asset_persistence.get_asset_by_id(asset_id=asset_id)

    #         if not partners_asset or not partners_asset.file_url:
    #             print("Invalid asset or missing file URL.")
    #             return None, "Error downloading"

    #         try:
    #             response = requests.get(partners_asset.file_url, stream=True)
    #             response.raise_for_status()

    #             url_path = urlparse(partners_asset.file_url).path
    #             file_extension = os.path.splitext(url_path)[-1]
    #             filename = f"{partners_asset.title}{file_extension}"
    #             safe_filename = os.path.join(os.getcwd(), filename)

    #             with open(safe_filename, 'wb') as file:
    #                 for chunk in response.iter_content(chunk_size=8192):
    #                     file.write(chunk)
    #             print(f"File successfully downloaded: {safe_filename}")
                
    #             file_stream = BytesIO()
    #             for chunk in response.iter_content(chunk_size=8192):
    #                 file_stream.write(chunk)

    #             file_stream.seek(0)

    #             return StreamingResponse(
    #                 file_stream,
    #                 media_type="application/octet-stream",
    #                 headers={
    #                     "Content-Disposition": f"attachment; filename={filename}"
    #                 }
    #             ), None

    #         except requests.exceptions.RequestException as e:
    #             print(f"Error downloading file: {e}")
    #             return None, f"Error downloading file: {str(e)}"

    #     print("Invalid asset ID.")
    #     return None, "Error downloading"

    def domain_mapped(self, asset: PartnersAsset):
        return PartnersAssetResponse(
            id=asset.id,
            title=asset.title,
            type=asset.type,
            preview_url=asset.preview_url,
            file_url=asset.file_url
        ).model_dump()