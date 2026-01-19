from pydantic import BaseModel


class SlackCreateListRequest(BaseModel):
    name: str
