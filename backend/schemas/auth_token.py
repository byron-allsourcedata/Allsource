from typing import Optional
from pydantic import BaseModel

class Token(BaseModel):
    id: int
    team_member_id: Optional[int] = None
