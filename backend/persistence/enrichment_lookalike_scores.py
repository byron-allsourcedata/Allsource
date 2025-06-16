import logging
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

    def bulk_insert(self, lookalike_id: UUID, scores: List[Tuple[UUID, float]]):
        self.clickhouse_bulk_insert(lookalike_id, scores)
        # self.db.bulk_save_objects(
        #     [
        #         EnrichmentLookalikeScore(
        #             lookalike_id=lookalike_id,
        #             enrichment_user_id=user_id,
        #             score=score,
        #         )
        #         for user_id, score in scores
        #     ]
        # )

    def clickhouse_bulk_insert(
        self, lookalike_id: UUID, scores: list[tuple[UUID, float]]
    ):
        rows = [(lookalike_id, user_id, score) for user_id, score in scores]
        query_result = self.ch.insert("enrichment_lookalike_scores", rows)
        logger.debug(f"Written rows to scores: {query_result.written_rows}")

    def commit(self):
        self.db.commit()


EnrichmentLookalikeScoresPersistenceDep = EnrichmentLookalikeScoresPersistence
