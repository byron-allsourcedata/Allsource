from uuid import UUID
from domains.leads.flags import (
    resolve_is_active,
    resolve_is_confirmed,
    resolve_is_checked,
)
from domains.leads.entities import LeadUser, Visit


def aggregate_users(visits: list[Visit]) -> list[LeadUser]:
    users: dict[tuple[UUID, str], LeadUser] = {}

    for v in visits:
        key = (v.pixel_id, v.profile_pid_all)
        if key not in users:
            users[key] = _init_user(v)
        _update_user(users[key], v)

    return list(users.values())


def _init_user(v: Visit) -> LeadUser:
    return LeadUser(
        pixel_id=v.pixel_id,
        profile_pid_all=v.profile_pid_all,
        company_id=v.company_id,
        behavior_type=v.behavior_type,
        created_at=v.visit_start,
        first_visit_id=str(v.visit_id),
        is_converted_sales=0,
        is_returning_visitor=0,
        total_visit=0,
        average_visit_time=0,
        total_visit_time=0,
        is_active=0,
        is_confirmed=0,
        is_checked=0,
        email_sha256_lc_hem=v.email_sha256_lc_hem,
        email_md5_lc_hem=v.email_md5_lc_hem,
        updated_at=v.visit_end,
    )


def _update_user(u: LeadUser, v: Visit) -> None:
    u.total_visit += 1
    u.total_visit_time += v.full_time_sec
    u.average_visit_time = u.total_visit_time // max(u.total_visit, 1)
    u.updated_at = max(u.updated_at, v.visit_end)
    u.is_returning_visitor = int(u.total_visit > 1)

    if not u.company_id and v.company_id:
        u.company_id = v.company_id

    # Temporary simplified flags (always 1):
    u.is_active = resolve_is_active(u.updated_at)
    u.is_confirmed = resolve_is_confirmed(u.email_sha256_lc_hem)
    u.is_checked = resolve_is_checked(u.email_sha256_lc_hem)
