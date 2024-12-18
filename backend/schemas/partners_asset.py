from pydantic import BaseModel
from typing import Optional
from enums import PartnersAssetsInfoEnum


class PartnersAssetResponse(BaseModel):
    id: int
    title: str
    type: str
    preview_url: Optional[str] = None
    file_url: str
    file_extension: str
    file_size: str


class PartnersAssetsInfoResponse(BaseModel):
    status: PartnersAssetsInfoEnum
