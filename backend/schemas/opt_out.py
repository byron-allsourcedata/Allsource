from pydantic import BaseModel, EmailStr


class OptOutRequest(BaseModel):
    email: EmailStr
    recaptcha_token: str
