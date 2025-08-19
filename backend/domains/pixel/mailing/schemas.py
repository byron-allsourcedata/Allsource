from pydantic import BaseModel


class MailingUserData(BaseModel):
    full_name: str
    email: str


class ManualPixelRequest(BaseModel):
    user_id: int
    domain_id: int
