from typing import Annotated

from resolver import get_dependency
from .interface import AudienceSourcesPersistenceInterface
from .unified import AudienceSourcesUnifiedPersistence

AudienceSourcesUnifiedPersistence = Annotated[
    AudienceSourcesPersistenceInterface,
    get_dependency(AudienceSourcesUnifiedPersistence),
]
