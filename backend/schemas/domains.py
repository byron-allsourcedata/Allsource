from pydantic import BaseModel
from typing import Optional
class DomainScheme(BaseModel):
    domain: str

class DomainResponse(BaseModel):
    id: int
    domain: str
    data_provider_id: Optional[str] = None
    is_pixel_installed: bool
    enable: bool