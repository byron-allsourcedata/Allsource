from datetime import datetime, timedelta, timezone

def get_utc_aware_date():
    return datetime.now(timezone.utc).replace(microsecond=0)

def get_utc_aware_date_for_postgres():
    return get_utc_aware_date().isoformat()[:-6] + "Z"
