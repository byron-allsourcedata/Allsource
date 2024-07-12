from pydantic import BaseModel


class AuthGoogleToken(BaseModel):
    token: str
    is_without_card: bool
