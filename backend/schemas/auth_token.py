from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    id: int
    team_member_id: Optional[int] = None
    requester_access_user_id: Optional[int] = None