from pydantic import BaseModel, Field


class PixelInstallationRequest(BaseModel):
    url: str = Field(...)
