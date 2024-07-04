from pydantic import BaseModel


class Token(BaseModel):
    id: int
