from fastapi.responses import StreamingResponse
import logging
import os
from urllib.parse import urlparse
import requests
from io import BytesIO
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

    def download_asset(self, asset_id):
        if asset_id:

            partners_asset = self.partners_asset_persistence.get_asset_by_id(asset_id=asset_id)

            if not partners_asset or not partners_asset.file_url:
                logger.debug('Invalid asset or missing file URL')
                return False

            try:
                response = requests.get(partners_asset.file_url, stream=True)
                response.raise_for_status()

                file_stream = BytesIO()
                for chunk in response.iter_content(chunk_size=8192):
                    file_stream.write(chunk)

                file_stream.seek(0)

                return StreamingResponse(
                    file_stream,
                    media_type="application/octet-stream",
                )

            except requests.exceptions.RequestException as err:
                logger.debug('Error downloading file', err)
                return False

        return False

    def get_file_size(self, file_url: str) -> str:
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

    def domain_mapped(self, asset: PartnersAsset):
        url_path = urlparse(asset.file_url).path
        file_extension = os.path.splitext(url_path)[-1][1:].capitalize()
        file_size = self.get_file_size(asset.file_url)
        return PartnersAssetResponse(
            id=asset.id,
            title=asset.title,
            type=asset.type,
            preview_url=asset.preview_url,
            file_url=asset.file_url,
            file_extension=file_extension,
            file_size=file_size,
        ).model_dump()