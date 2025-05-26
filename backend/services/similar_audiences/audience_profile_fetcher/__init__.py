from typing import Annotated

from resolver import get_dependency
from .interface import ProfileFetcherInterface
from .clickhouse import ClickhouseProfileFetcher

# Provide for FastAPI default implementation for ProfileFetcher
ProfileFetcher = Annotated[ProfileFetcherInterface, get_dependency(ClickhouseProfileFetcher)]
