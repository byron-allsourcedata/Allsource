from typing import List, Tuple
from uuid import UUID

from fastapi import Depends
from sqlalchemy.orm import Session
from typing_extensions import Annotated

from dependencies import Db
from models.enrichment_lookalike_scores import EnrichmentLookalikeScore


class EnrichmentLookalikeScoresPersistence:
    db: Session

    def __init__(self, db: Session):
        self.db = db


    def insert(self, lookalike_id: UUID, user_id: UUID, score: float):
        new_score = EnrichmentLookalikeScore(
            lookalike_id=lookalike_id,
            enrichment_user_id=user_id,
            score=score
        )

        self.db.add(new_score)
        return new_score

    def bulk_insert(self, lookalike_id: UUID, scores: List[Tuple[UUID, float]]):
        self.db.bulk_save_objects([
            EnrichmentLookalikeScore(
                lookalike_id=lookalike_id,
                enrichment_user_id=user_id,
                score=score
            ) for user_id, score in scores
        ])


def get_persistence_repository(db: Db) -> EnrichmentLookalikeScoresPersistence:
    return EnrichmentLookalikeScoresPersistence(db)


EnrichmentLookalikeScoresPersistenceDep = Annotated[EnrichmentLookalikeScoresPersistence, Depends(get_persistence_repository)]