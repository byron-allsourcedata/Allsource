from pydantic import BaseModel
from typing import Optional


class AuthGoogleData(BaseModel):
    token: str
    is_without_card: Optional[bool] = False
    teams_token: Optional[str] = None
    
