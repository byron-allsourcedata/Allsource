from pydantic import BaseModel


class InviteDetailsRequest(BaseModel):
    name: str
    email: str