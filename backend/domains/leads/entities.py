from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class Visit:
    profile_pid_all: str
    pixel_id: UUID
    visit_id: UUID

    page: str
    page_parameters: str | None
    requested_at: datetime

    spent_time_sec: int
    visit_start: datetime
    visit_end: datetime

    behavior_type: str | None
    ip: str | None

    pages_count: int
    average_time_sec: int
    full_time_sec: int

    # enrich fields for Leads Users
    company_id: str | None = None
    email_sha256_lc_hem: str | None = None
    email_md5_lc_hem: str | None = None


@dataclass
class LeadUser:
    id: UUID
    pixel_id: UUID
    profile_pid_all: str

    company_id: str | None
    behavior_type: str | None

    created_at: datetime
    first_visit_id: str | None

    is_converted_sales: int
    is_returning_visitor: int

    total_visit: int
    average_visit_time: int
    total_visit_time: int

    is_active: int
    is_confirmed: int
    is_checked: int

    email_sha256_lc_hem: str | None
    email_md5_lc_hem: str | None

    updated_at: datetime
