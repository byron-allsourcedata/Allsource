from pydantic import BaseModel


class AuthGoogleData(BaseModel):
    token: str
    is_without_card: bool
