from pydantic import BaseModel, Field
from uuid import UUID


class DataProvidersResponse(BaseModel):
    data_providers_ids: list[str]

class PixelsResponse(BaseModel):
    pixel_ids: list[UUID]
    data_providers_ids: list[str]


class PixelInstallationRequest(BaseModel):
    pixelClientId: UUID | None = Field(None)
    url: str = Field(...)
    need_reload_page: bool | None = Field(False)
