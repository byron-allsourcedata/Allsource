from typing import List
from uuid import UUID

from db_dependencies import ClickhouseInserter
from persistence.audience_smarts.postgres import (
    AudienceSmartsPostgresPersistence,
)
from resolver import injectable


@injectable
class AudienceSourcesClickhousePersistence:
    def __init__(
        self,
        client_inserter: ClickhouseInserter,
        postgres: AudienceSmartsPostgresPersistence,
    ):
        self.client_inserter = client_inserter
        self.postgres = postgres
