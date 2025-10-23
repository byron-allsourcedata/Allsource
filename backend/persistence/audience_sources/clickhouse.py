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
        self.table = "bin_logs"

    def delete_logs_by_source_id(self, source_id: UUID) -> List[dict]:
        self.client_inserter.command("SET max_query_size = 104857600")

        sql = f"ALTER TABLE {self.table} DELETE WHERE entity_id = %(id)s"
        self.client_inserter.command(sql, parameters={"id": source_id})
