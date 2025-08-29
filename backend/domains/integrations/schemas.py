from enum import Enum
from pydantic import BaseModel


class PremiumSourceIntegrationStatus(str, Enum):
    INTEGRATED = "integrated"
    NOT_INTEGRATED = "not_integrated"
    FAILED = "failed"


class PremiumSourceIntegration(BaseModel):
    integration_id: int | None
    service_name: str
    status: PremiumSourceIntegrationStatus
    image: str | None


class PremiumSourceErrorCode(str, Enum):
    MISSING_COLUMN = "missing_column"
    BAD_ENCODING = "bad_encoding"
