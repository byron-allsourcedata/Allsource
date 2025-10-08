from pydantic import BaseModel, Field


class ChosenOwnerUser(BaseModel):
    id: int = Field(...)
