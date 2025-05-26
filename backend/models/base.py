from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import declarative_base

Base = declarative_base()



def update_timestamps(mapper: Any, connection: Any, target: Any) -> None:  # pyright: ignore
    target.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
