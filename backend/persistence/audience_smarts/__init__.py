from typing import Annotated

from resolver import get_dependency
from .interface import AudienceSmartsPersistenceInterface
from .unified import AudienceSmartsUnifiedPersistence

AudienceSmartsPersistence = Annotated[
    AudienceSmartsPersistenceInterface,
    get_dependency(AudienceSmartsUnifiedPersistence),
]
