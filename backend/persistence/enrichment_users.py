from typing import List
from uuid import UUID

from sqlalchemy import select

from db_dependencies import Db
from models import EnrichmentUser
from resolver import injectable


@injectable
class EnrichmentUsersPersistence:
    def __init__(self, db: Db):
        self.db = db

    def fetch_enrichment_user_ids(
        self,
        asids: List[UUID]
    ) -> List[UUID]:
        query = select(
            EnrichmentUser
        ).where(EnrichmentUser.asid.in_(asids))
        rows = self.db.execute(query).scalars()

        return [row.id for row in rows]