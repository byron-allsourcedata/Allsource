from typing import Any
from uuid import uuid5, NAMESPACE_URL
from collections import defaultdict
from datetime import datetime, timezone
import json

from domains.leads.entities import Visit


def map_behavior_type(event_type: str) -> str:
    mapping = {
        "page_view": "visitor",
        "click": "view_product",
    }
    return mapping.get(event_type, "visitor")


def floor_to_slot(ts: datetime) -> datetime:
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    else:
        ts = ts.astimezone(timezone.utc)

    minute = (ts.minute // 30) * 30
    return ts.replace(minute=minute, second=0, microsecond=0)


def build_visits(events: list[dict]) -> list[Visit]:
    """
    Return event-level Visit rows with visit-level aggregates duplicated.
    """

    buckets: dict[tuple, list[tuple[datetime, dict[Any, Any]]]] = defaultdict(
        list
    )

    for e in events:
        profile = e.get("profile_pid_all")
        if not profile:
            continue

        ts = e["timestamp"]
        if isinstance(ts, str):
            ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))

        slot_start = floor_to_slot(ts)
        key = (e["pixel_id"], profile, slot_start)
        buckets[key].append((ts, e))

    visits: list[Visit] = []

    for (pixel_id, profile, slot_start), evs in buckets.items():
        evs.sort(key=lambda x: x[0])

        visit_start = evs[0][0]
        visit_end = evs[-1][0]

        full_time = max(int((visit_end - visit_start).total_seconds()), 1)
        pages_count = len(evs)
        average_time = max(full_time // pages_count, 1)

        visit_id = uuid5(
            NAMESPACE_URL,
            f"{pixel_id}:{profile}:{slot_start.isoformat()}",
        )

        for i, (ts, e) in enumerate(evs):
            if i + 1 < len(evs):
                delta = int((evs[i + 1][0] - ts).total_seconds())
                spent = max(delta, 1)
            else:
                spent = 1

            data = e.get("event_data") or {}
            page = data.get("url") or data.get("page") or ""
            params = (
                json.dumps(data, ensure_ascii=False)
                if isinstance(data, dict)
                else None
            )

            visits.append(
                Visit(
                    profile_pid_all=profile,
                    pixel_id=pixel_id,
                    visit_id=visit_id,
                    page=page,
                    page_parameters=params,
                    requested_at=ts,
                    spent_time_sec=spent,
                    visit_start=visit_start,
                    visit_end=visit_end,
                    behavior_type=map_behavior_type(e.get("event_type")),
                    ip=e.get("client_ip") or e.get("ip"),
                    pages_count=pages_count,
                    average_time_sec=average_time,
                    full_time_sec=full_time,
                    company_id=e.get("company_id"),
                    email_md5_lc_hem=e.get("email_md5_lc_hem"),
                    email_sha256_lc_hem=e.get("sha256_lc_hem"),
                )
            )

    return visits
