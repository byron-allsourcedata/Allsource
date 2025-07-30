from pydantic import BaseModel


class AccessCheckResponse(BaseModel):
    allowed: bool


class SmartMatchingInfo(BaseModel):
    validated_records: int
    status: str
