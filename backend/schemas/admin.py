from pydantic import BaseModel


class InviteDetailsRequest(BaseModel):
    name: str
    email: str


class ChangeRequestBody(BaseModel):
    user_id: int
    plan_alias: str


class ChangePlanResponse(BaseModel):
    success: bool
    message: str
