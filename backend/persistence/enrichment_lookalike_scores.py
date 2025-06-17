import logging
from time import sleep
from typing import List, Tuple
from uuid import UUID

from db_dependencies import Db, Clickhouse
from models.enrichment.enrichment_lookalike_scores import (
    EnrichmentLookalikeScore,
)
from resolver import injectable


logger = logging.getLogger(__name__)


@injectable
class EnrichmentLookalikeScoresPersistence:
    def __init__(self, db: Db, ch: Clickhouse):
        self.db = db
        self.ch = ch

    def insert(self, lookalike_id: UUID, user_id: UUID, score: float):
        new_score = EnrichmentLookalikeScore(
            lookalike_id=lookalike_id, enrichment_user_id=user_id, score=score
        )

        self.db.add(new_score)
        return new_score

    def select_top(
        self, lookalike_id: UUID, source_asids: list[UUID], top_count: int
    ) -> list[dict]:
        logger.info(f"provided source_asids: {len(source_asids)}  {top_count}")
        query = """
        select asid, score from enrichment_lookalike_scores
            where lookalike_id = %(lookalike_id)s
           
            order by score desc
            limit %(total_rows)s
        """

        result = self.ch.query(
            query,
            parameters={
                "lookalike_id": lookalike_id,
                "source_uuids": source_asids,
                "total_rows": top_count,
            },
        )
        names: list[str] = result.column_names
        rows = [dict(zip(names, vals)) for vals in result.result_set]

        logger.info(f"rows: {len(rows)}  ")
        return rows

    def bulk_insert(self, lookalike_id: UUID, scores: List[Tuple[UUID, float]]):
        self.clickhouse_bulk_insert(lookalike_id, scores)

    def clickhouse_bulk_insert(
        self, lookalike_id: UUID, scores: list[tuple[UUID, float]]
    ):
        rows = [(user_id, lookalike_id, score) for user_id, score in scores]
        query_result = self.ch.insert("enrichment_lookalike_scores", rows)
        logger.info(f"Written rows to scores: {query_result.written_rows}")

    def commit(self):
        self.db.commit()


EnrichmentLookalikeScoresPersistenceDep = EnrichmentLookalikeScoresPersistence
