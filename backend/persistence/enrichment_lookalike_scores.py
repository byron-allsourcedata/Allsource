from decimal import Decimal
from typing import List, Tuple
from uuid import UUID

from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from db_dependencies import Db
from models import AudienceSourcesMatchedPerson
from models.enrichment.enrichment_lookalike_scores import EnrichmentLookalikeScore
from resolver import injectable


@injectable
class EnrichmentLookalikeScoresPersistence:
    db: Session

    def __init__(self, db: Db):
        self.db = db


    def get_lookalike_scores(
        self,
        source_uuid: UUID,
        lookalike_id: UUID,
        total_rows: int
    ) -> List[Tuple[UUID, Decimal]]:
        source_uid_select = (
            select(AudienceSourcesMatchedPerson.enrichment_user_id)
            .where(AudienceSourcesMatchedPerson.source_id == source_uuid)
        )

        enrichment_lookalike_scores = (
            self.db.query(
                EnrichmentLookalikeScore.enrichment_user_id,
                EnrichmentLookalikeScore.score
            )
            .filter(
                EnrichmentLookalikeScore.lookalike_id == lookalike_id,
                ~EnrichmentLookalikeScore.enrichment_user_id.in_(source_uid_select)
            )
            .order_by(desc(EnrichmentLookalikeScore.score))
            .limit(total_rows)
            .all()
        )

        return [ (scores[0], scores[1]) for scores in enrichment_lookalike_scores]


    def insert(self, lookalike_id: UUID, user_id: UUID, score: Decimal):
        new_score = EnrichmentLookalikeScore(
            lookalike_id=lookalike_id,
            enrichment_user_id=user_id,
            score=score
        )

        self.db.add(new_score)
        return new_score

    def bulk_insert(self, lookalike_id: UUID, scores: List[Tuple[UUID, Decimal]]):
        self.db.bulk_save_objects([
            EnrichmentLookalikeScore(
                lookalike_id=lookalike_id,
                enrichment_user_id=user_id,
                score=score
            ) for user_id, score in scores
        ])

    def commit(self):
        self.db.flush()
        self.db.commit()

