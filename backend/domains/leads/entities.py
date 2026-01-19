from dataclasses import dataclass
from datetime import datetime
from uuid import UUID
from pydantic import EmailStr


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


@dataclass
class LeadUserAdapter:
    id: UUID | None
    first_visit_id: UUID | None


@dataclass
class DelivrUser:
    id: int | None = None
    first_name: str | None = None
    last_name: str | None = None
    business_email: str | None = None
    business_email_last_seen: str | None = None
    programmatic_business_emails: str | None = None
    mobile_phone: str | None = None
    direct_number: str | None = None
    personal_phone: str | None = None
    linkedin_url: str | None = None
    personal_address: str | None = None
    personal_address_2: str | None = None
    personal_city: str | None = None
    personal_state: str | None = None
    personal_zip: str | None = None
    personal_zip4: str | None = None
    personal_emails: str | None = None
    additional_personal_emails: str | None = None
    gender: str | None = None
    married: str | None = None
    children: str | None = None
    income_range: str | None = None
    net_worth: str | None = None
    homeowner: str | None = None
    job_title: str | None = None
    seniority_level: str | None = None
    department: str | None = None
    professional_address: str | None = None
    professional_address_2: str | None = None
    professional_city: str | None = None
    professional_state: str | None = None
    professional_zip: str | None = None
    professional_zip4: str | None = None
    company_name: str | None = None
    company_domain: str | None = None
    company_phone: str | None = None
    company_sic: str | None = None
    company_address: str | None = None
    company_city: str | None = None
    company_state: str | None = None
    company_zip: str | None = None
    company_linkedin_url: str | None = None
    company_revenue: str | None = None
    company_employee_count: str | None = None
    primary_industry: str | None = None
