from dataclasses import dataclass
from datetime import datetime, timedelta, timezone


SLOT_MINUTES = 30
OVERLAP_MINUTES = 30


@dataclass
class Window:
    read_from: datetime
    read_to: datetime
    slot_start: datetime
    slot_end: datetime


def _floor_to_slot(ts: datetime) -> datetime:
    # ts is timezone-aware UTC
    minute = (ts.minute // SLOT_MINUTES) * SLOT_MINUTES
    return ts.replace(minute=minute, second=0, microsecond=0)


def resolve_window(now: datetime | None = None) -> Window:
    """
    Build processing window aligned to closed 30-min UTC slots.
    Slot_end = floor_to_slot(now); slot_start = slot_end - 30m.
    Read window includes previous 30m overlap: [slot_start - 30m, slot_end)
    All times are UTC.
    """
    ts_now = now or datetime.now(timezone.utc)
    slot_end = _floor_to_slot(ts_now)
    slot_start = slot_end - timedelta(minutes=SLOT_MINUTES)
    return Window(
        read_from=slot_start - timedelta(minutes=OVERLAP_MINUTES),
        read_to=slot_end,
        slot_start=slot_start,
        slot_end=slot_end,
    )
