from pydantic import BaseModel, EmailStr
from typing import Optional, Dict

class SendlaneList(BaseModel):
    id: int
    name: str
    description: str
    status: str
    created: str
    sender_id: int
    flagged: str


class SendlaneSender(BaseModel):
    id: str
    sender_name: str

class SendlaneContact(BaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email_consent: bool = True
    