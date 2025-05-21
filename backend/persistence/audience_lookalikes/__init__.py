from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from .interface import AudienceLookalikesPersistenceInterface
from .postgres import AudienceLookalikesPostgresPersistence

def get_audience_lookalikes_persistence(db: Session) -> AudienceLookalikesPersistenceInterface:
    return AudienceLookalikesPostgresPersistence(db)

AudienceLookalikesPersistence = Annotated[AudienceLookalikesPostgresPersistence, Depends(get_audience_lookalikes_persistence)]

