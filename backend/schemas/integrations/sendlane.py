from pydantic import BaseModel, EmailStr
from typing import List, Any, Optional



# class SendlaneCustomer(BaseModel):
#     sendlane_user_id: int
#     email: EmailStr
#     first_name: str
#     integration_customer: List[Any]
#     last_name: str
#     lifetime_value: int
#     lists: List[Contact]
#     phone: str
#     sms_consent: List[Any]
#     subcribed: bool
#     suppressed: bool
#     tags: List[Contact]


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