from dataclasses import dataclass
from pydantic import BaseModel
from datetime import datetime


class InviteDetailsRequest(BaseModel):
    name: str
    email: str


class ChangeRequestBody(BaseModel):
    user_id: int
    plan_alias: str


class ChangePlanResponse(BaseModel):
    success: bool
    message: str


@dataclass
class PartnersQueryParams:
    is_master: bool
    search_query: str | None = None
    page: int = 1
    per_page: int = 9
    sort_by: str | None = None
    sort_order: str | None = None
    exclude_test_users: bool = False
    last_login_date_start: int | None = None
    last_login_date_end: int | None = None
    join_date_start: int | None = None
    join_date_end: int | None = None
    statuses: str | None = None


class UserResult(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: datetime
    status: str
    last_login: datetime
    role: str
    pixel_installed_count: int
    sources_count: int
    contacts_count: int
    subscription_plan: str
    lookalikes_count: int
    type: str
    credits_count: int
    is_another_domain_resolved: bool


class PartnersResult(BaseModel):
    users: list[UserResult]
    count: int
