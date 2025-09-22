from pydantic import BaseModel
from typing import Optional, List, Any, Union


class AdAccountScheme(BaseModel):
    id: str
    name: str


class TosAccepted(BaseModel):
    custom_audience_tos: Optional[int] = None
    web_custom_audience_tos: Optional[int] = None
    value_based_custom_audience_tos: Optional[int] = None


class TosStatus(BaseModel):
    ok: bool
    error: Optional[str] = None
    status_code: Optional[int] = None
    tos_accepted: Optional[TosAccepted] = None
    raw: Optional[Any] = None


class AssignedUser(BaseModel):
    id: Union[str, int]
    name: Optional[str] = None
    role: Optional[str] = None
    tasks: Optional[List[str]] = []


class AssignedUsersResult(BaseModel):
    ok: bool
    error: Optional[str] = None
    assigned_users: List[AssignedUser] = []
    raw: Any = None
    status_code: Any = None


class CanAcceptResult(BaseModel):
    can_accept: bool
    reason: Optional[str] = None
    tos_accepted: bool = False
    terms_link: Optional[str] = None
    assigned_tasks: Optional[List[str]] = None
    assigned_users: Optional[List[AssignedUser]] = None
    debug: Any = None
    raw: Any = None
