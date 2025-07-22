from pydantic import BaseModel, Field


class DataProvidersResponse(BaseModel):
    data_providers_ids: list[str]


class PixelInstallationRequest(BaseModel):
    pixelClientId: str | None = Field(None)
    url: str = Field(...)
    need_reload_page: bool | None = Field(False)
