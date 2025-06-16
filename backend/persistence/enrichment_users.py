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
        count, = result.first_row
        return count


    def fetch_enrichment_user_ids(self, asids: List[UUID]) -> List[UUID]:
        query = select(EnrichmentUser).where(EnrichmentUser.asid.in_(asids))
        rows = self.db.execute(query).scalars()

        return [row.id for row in rows]
