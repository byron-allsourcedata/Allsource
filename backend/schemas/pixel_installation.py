from pydantic import BaseModel, Field
from typing import Optional

class PixelInstallationRequest(BaseModel):
    pixelClientId: Optional[str] = Field(None)
    url: str = Field(...)
    need_reload_page: Optional[bool] = Field(False)


class EmailFormRequest(BaseModel):
    email: str = Field(...)


class ManualFormResponse(BaseModel):
    manual: str = Field(...)
    pixel_client_id: str = Field(...)
