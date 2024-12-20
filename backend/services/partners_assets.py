import logging
import os
from typing import Union
import tempfile
import hashlib
import zipfile
from pathlib import Path
from PIL import Image
import ffmpeg
import subprocess
from fastapi import HTTPException, UploadFile
from io import BytesIO
from urllib.parse import urlparse
import requests
from enums import PartnersAssetsInfoEnum
from models.partners_asset import PartnersAsset
from services.aws import AWSService
from persistence.partners_asset_persistence import PartnersAssetPersistence
from schemas.partners_asset import PartnersAssetResponse

logger = logging.getLogger(__name__)


class PartnersAssetService:

    def __init__(self,
        partners_asset_persistence: PartnersAssetPersistence,
        aws_service: AWSService):
        self.partners_asset_persistence = partners_asset_persistence
        self.AWS = aws_service
        self.aws_cloud = os.getenv("S3_URL")


    def get_assets(self):
        assets = self.partners_asset_persistence.get_assets()
        return [
            self.domain_mapped(asset)
            for i, asset in enumerate(assets)
        ]
    

    def delete_asset(self, id: int):
        if not id:
            return PartnersAssetsInfoEnum.NOT_VALID_ID
        try:
            self.partners_asset_persistence.delete_asset(asset_id=id)
            return PartnersAssetsInfoEnum.SUCCESS
        except Exception as e:
            logger.debug('Error deleting assets file', e)
            raise HTTPException(status_code=500, detail=f"Unexpected error during delete: {str(e)}")


    async def update_asset(self, asset_id: int, description: str, type: str, file: UploadFile = None):
        if not asset_id or not description or not type:
            return PartnersAssetsInfoEnum.NOT_VALID_DATA
        
        updating_data = {"description": description}

        if file:
            updating_data.update(await self.upload_files_asset(file, type))
 
        try:
            updated_data = self.partners_asset_persistence.update_asset(asset_id, updating_data)

            if not updated_data:
                logger.debug('Database error during updation', e)
                raise HTTPException(status_code=500, detail="Asset not updated")

            return {"status": PartnersAssetsInfoEnum.SUCCESS, "data": self.domain_mapped(updated_data)}
        except Exception as e:
            logger.debug('Error updating assets file', e)
            raise HTTPException(status_code=500, detail=f"Unexpected error during update: {str(e)}")
    

    async def upload_files_asset(self, file: UploadFile, type: str):
        files_data = {}
        try:
            file_contents = await file.read()
            file_extension = Path(file.filename).suffix.lower()

            file_hash = hashlib.sha256(file_contents).hexdigest()
            file_key = f'partners-assets/{file_hash}{file_extension}'
            file_url = f'{self.aws_cloud}/{file_key}'

            if self.AWS.file_exists(file_key):
                files_data["file_url"] = file_url
            else: 
                self.AWS.upload_string(file_contents, file_key)
                files_data["file_url"] = file_url

            preview = await self.generate_preview(file_contents, file_extension, type)
            if preview:
                file_preview_contents = preview.read()
                preview_key = f'partners-assets/{file_hash}_preview.jpg'
                preview_url = f'{self.aws_cloud}/{preview_key}'
                self.AWS.upload_string(file_preview_contents, preview_key)
                files_data["preview_url"] = preview_url
                if self.AWS.file_exists(preview_key):
                    files_data["preview_url"] = preview_url
                else:
                    self.AWS.upload_string(file_preview_contents, preview_key)
                    files_data["preview_url"] = preview_url
            else:
                files_data["preview_url"] = None
            return files_data
        except Exception as e:
            logger.debug('Error uploading assets file', e)
            raise HTTPException(status_code=500, detail=f"Error during file upload: {str(e)}")


    async def create_asset(self, description: str, type: str, file: UploadFile = None):
        if not file or not description or not type:
            return PartnersAssetsInfoEnum.NOT_VALID_DATA
        
        try:
            creating_data = await self.upload_files_asset(file, type)
            creating_data.update({"description": description, "type": type})

            created_data = self.partners_asset_persistence.create_data(creating_data)

            if not created_data:
                logger.debug('Database error during creation', e)
                raise HTTPException(status_code=500, detail="Asset not created")

            return {"status": PartnersAssetsInfoEnum.SUCCESS, "data": self.domain_mapped(created_data)}
        except Exception as e:
            logger.debug('Error creating assets file', e)
            raise HTTPException(status_code=500, detail=f"Unexpected error during creation: {str(e)}")

    
    async def generate_preview(self, file_contents: bytes, file_extension: str, type_asset: str) -> Union[BytesIO, None]:
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
                temp_file.write(file_contents)
                temp_file_path = temp_file.name

            if type_asset == "image":
                return self._generate_image_preview(temp_file_path)

            elif type_asset == "video":
                return self._generate_video_preview(temp_file_path)

            elif type_asset == "presentation":
                return self._generate_presentation_preview(temp_file_path)
            else:
                return None
        except Exception as e:
            logger.debug('Error generating preview', e)
            return None
    

    def _generate_image_preview(self, file_path: str) -> BytesIO:
        try:
            with Image.open(file_path) as img:
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                img.thumbnail((300, 300))
                preview = BytesIO()
                img.save(preview, format="JPEG")
                preview.seek(0)
                return preview
        except Exception as e:
            logger.debug('Error generating preview image', e)
            return None


    def _generate_video_preview(self, file_path: str) -> BytesIO:
        try:
            preview_path = f"{file_path}_preview.jpg"
            subprocess.run(
                [
                    "ffmpeg",
                    "-i", file_path,
                    "-ss", "00:00:01.000",
                    "-vframes", "1",
                    preview_path,
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )

            with open(preview_path, "rb") as preview_file:
                preview = BytesIO(preview_file.read())
            return preview
        except Exception as e:
            logger.debug('Error generating preview video', e)
            return None

    

    def _generate_presentation_preview(self, presentation_path: str) -> Union[BytesIO, None]:
        min_width, min_height = 200, 200

        try:
            with zipfile.ZipFile(presentation_path, 'r') as pptx_zip:
                media_files = [f for f in pptx_zip.namelist() if f.startswith('ppt/media/') and f.endswith(('.jpg', '.jpeg', '.png'))]

                for media_file in media_files:
                    image_data = pptx_zip.read(media_file)
                    with Image.open(BytesIO(image_data)) as img:
                        if img.width >= min_width and img.height >= min_height:
                            preview_image = BytesIO()
                            img.convert('RGB').save(preview_image, format='JPEG')
                            preview_image.seek(0)
                            return preview_image
            return None
        except Exception as e:
            logger.debug('Error generating preview presentation', e)
            return None


    def get_file_size(self, file_url: str) -> str:
        if not file_url:
            return "0.00 MB"
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


    def get_file_extension(self, file_url) -> str:
        if not file_url:
            return "Unknown"
        url_path = urlparse(file_url).path
        extension = os.path.splitext(url_path)[-1][1:].capitalize()
        if not extension:
            return "Unknown"
        return extension


    def get_video_duration(self, type: str, file_url: str) -> str:
        if not file_url or type != "video":
            return "00:00"
        try:
            response = requests.get(file_url, stream=True, timeout=10)
            if response.status_code == 200:
                local_file = "temp_video_file"
                with open(local_file, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                try:
                    probe = ffmpeg.probe(local_file)
                    duration = float(probe['format']['duration'])
                    os.remove(local_file)

                    minutes, seconds = divmod(int(duration), 60)
                    return f"{minutes:02}:{seconds:02}"
                except Exception as err:
                    logger.debug("Error calculating video duration", err)
                    os.remove(local_file)
                    return "00:00"
            else:
                return "00:00"
        except Exception as err:
            logger.debug("Error fetching video file", err)
            return "00:00"


    def domain_mapped(self, asset: PartnersAsset):
        return PartnersAssetResponse(
            id=asset.id,
            title=asset.title,
            type=asset.type,
            preview_url=asset.preview_url,
            file_url=asset.file_url,
            file_extension=self.get_file_extension(asset.file_url),
            file_size=self.get_file_size(asset.file_url),
            video_duration=self.get_video_duration(asset.type, asset.file_url),
        ).model_dump()