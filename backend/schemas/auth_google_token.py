from pydantic import BaseModel
from typing import Optional


class AuthGoogleData(BaseModel):
    token: str
    is_without_card: Optional[bool] = True
    teams_token: Optional[str] = None
    spi: Optional[str] = None
    awc: Optional[str] = None
    
