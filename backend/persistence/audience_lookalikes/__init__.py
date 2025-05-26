from typing import Annotated

from fastapi import Depends

from services.similar_audiences.audience_profile_fetcher import get_dependency
from .interface import AudienceLookalikesPersistenceInterface
from .postgres import AudienceLookalikesPostgresPersistence

# Provide for FastAPI default implementation for ProfileFetcher
AudienceLookalikesPersistence = Annotated[AudienceLookalikesPersistenceInterface, get_dependency(AudienceLookalikesPostgresPersistence)]

