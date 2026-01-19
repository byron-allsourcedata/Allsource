from uuid import UUID

from typing_extensions import deprecated
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
    pixel_client_id: UUID = Field(...)


class PixelInstallationResponse(BaseModel):
    pixel_installation: bool


@deprecated("used in deprecated /verify_domains endpoint")
class DomainsListResponse(BaseModel):
    domains: List[str]


class DataProvidersResponse(BaseModel):
    data_providers_ids: list[str]


class PixelsResponse(BaseModel):
    pixel_ids: list[UUID]
    data_providers_ids: list[str]
