import logging
from typing import List
from uuid import UUID


from db_dependencies import Db, Clickhouse
from resolver import injectable


logger = logging.getLogger(__name__)


@injectable
class EnrichmentUsersPersistence:
    def __init__(self, db: Db, clickhouse: Clickhouse):
        self.db = db
        self.clickhouse = clickhouse

    def count(self):
        result = self.clickhouse.query("SELECT count() FROM enrichment_users")
        (count,) = result.first_row
        return count

    def fetch_enrichment_user_ids(self, asids: List[UUID]) -> List[UUID]:
        if not asids:
            return []

        sql = "SELECT asid FROM enrichment_users WHERE asid IN %(ids)s"

        self.clickhouse.command("SET max_query_size = 104857600")
        result = self.clickhouse.query(sql, {"ids": [str(a) for a in asids]})

        found = [row[0] for row in result.result_rows]
        logger.info(f"enrichment user ids rows: {len(found)}")
        return found
