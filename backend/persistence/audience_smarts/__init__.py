from typing import Annotated

from resolver import get_dependency
from .interface import AudienceSmartsPersistenceInterface
from .postgres import AudienceSmartsPostgresPersistence
from .clickhouse import AudienceSmartsClickhousePersistence

AudienceSmartsPersistence = Annotated[
    AudienceSmartsPersistenceInterface,
    get_dependency(AudienceSmartsClickhousePersistence),
]
