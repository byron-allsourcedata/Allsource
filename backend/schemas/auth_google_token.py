from pydantic import BaseModel


class AuthGoogleToken(BaseModel):
    id: str
    is_without_card: bool
