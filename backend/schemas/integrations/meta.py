from pydantic import BaseModel


class AdAccountScheme(BaseModel):
    id: str
    name: str
