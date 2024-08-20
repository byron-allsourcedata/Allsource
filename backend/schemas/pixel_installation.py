from pydantic import BaseModel, Field


class PixelInstallationRequest(BaseModel):
    url: str = Field(...)


class EmailFormRequest(BaseModel):
    email: str = Field(...)


class ManualFormResponse(BaseModel):
    manual: str = Field(...)
    pixel_client_id: str = Field(...)
