from pydantic import BaseModel
from fastapi import File
from typing import Dict, Optional
from enums import PartnersAssetsInfoEnum


class DomainScheme(BaseModel):
    domain: str

class PartnersAssetResponse(BaseModel):
    id: int
    title: str
    type: str
    preview_url: str
    file_url: str
    file_extension: str
    file_size: str


class PartnersAssetsInfoResponse(BaseModel):
    status: PartnersAssetsInfoEnum
