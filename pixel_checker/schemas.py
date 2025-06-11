from pydantic import BaseModel, Field
from typing import List, Optional


class DomainsListResponse(BaseModel):
    domains: List[str]

class PixelInstallationRequest(BaseModel):
    pixelClientId: Optional[str] = Field(None)
    url: str = Field(...)
    need_reload_page: Optional[bool] = Field(False)
