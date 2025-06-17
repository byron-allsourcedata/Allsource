from pydantic import BaseModel


class AccessCheckResponse(BaseModel):
    allowed: bool
