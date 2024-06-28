from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import declarative_base

Base = declarative_base()


def create_timestamps(mapper: Any, connection: Any, target: Any) -> None:  # pyright: ignore
    ts = datetime.now(timezone.utc).replace(microsecond=0)
    target.created_at = ts
    target.updated_at = ts


def replied_timestamps(mapper: Any, connection: Any, target: Any) -> None:  # pyright: ignore
    ts = datetime.now(timezone.utc).replace(microsecond=0)
    target.replied_at = ts


def update_timestamps(mapper: Any, connection: Any, target: Any) -> None:  # pyright: ignore
    target.updated_at = datetime.now(timezone.utc).replace(microsecond=0)
