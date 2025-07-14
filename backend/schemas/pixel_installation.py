from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List


class PixelInstallationRequest(BaseModel):
    pixelClientId: Optional[str] = Field(None)
    url: str = Field(...)
    need_reload_page: Optional[bool] = Field(False)


class EmailFormRequest(BaseModel):
    email: EmailStr


class ManualFormResponse(BaseModel):
    manual: str = Field(...)
    pixel_client_id: str = Field(...)


class PixelInstallationResponse(BaseModel):
    pixel_installation: bool


class DomainsListResponse(BaseModel):
    domains: List[str]
