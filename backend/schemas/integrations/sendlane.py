from pydantic import BaseModel, EmailStr
from typing import List, Any



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
    email: EmailStr
    first_name: str
    last_name: str
    phone: str
    email_consent: bool = True