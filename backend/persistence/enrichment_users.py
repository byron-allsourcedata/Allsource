from typing import List
from uuid import UUID

from sqlalchemy import select

from db_dependencies import Db, Clickhouse
from models import EnrichmentUser
from resolver import injectable


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

        sql = (
            "SELECT asid "
            "FROM maximiz_local.enrichment_users "
            "WHERE asid IN %(ids)s"
        )

        result = self.clickhouse.query(sql, {"ids": [str(a) for a in asids]})

        found = [row[0] for row in result.result_rows]
        print(f"enrichment user ids rows: {len(found)}")
        return found
