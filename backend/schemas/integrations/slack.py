from pydantic import BaseModel
from typing import Optional
from datetime import datetime
    
class SlackCreateListRequest(BaseModel):
    name: str
    is_private: bool = False
