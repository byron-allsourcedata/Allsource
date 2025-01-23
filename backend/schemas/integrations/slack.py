from pydantic import BaseModel
from typing import Optional
from datetime import datetime
    
class SlackCreateListRequest(BaseModel):
    channel_name: str
    is_private: str