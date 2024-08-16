from pydantic import BaseModel, Field


class PixelInstallationRequest(BaseModel):
    url: str = Field(...)


class EmailFormRequest(BaseModel):
    email: str = Field(...)
