from pydantic import BaseModel, Field


class PixelInstallationRequest(BaseModel):
    client_id: str = Field(...)
