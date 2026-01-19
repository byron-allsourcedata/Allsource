from datetime import datetime


def resolve_is_active(last_visit_at: datetime) -> int:
    """Temporary stub: always return truthy UInt8 for ClickHouse."""
    return 1


def resolve_is_confirmed(email_sha256: str | None) -> int:
    """Temporary stub: always return truthy UInt8 for ClickHouse."""
    return 1


def resolve_is_checked(email_sha256: str | None) -> int:
    """Temporary stub: always return truthy UInt8 for ClickHouse."""
    return 1
