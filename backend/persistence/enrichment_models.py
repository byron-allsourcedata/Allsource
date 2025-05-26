from typing import Optional
from uuid import UUID

from catboost import CatBoostRegressor
from sqlalchemy import select
from sqlalchemy.orm import Session

from db_dependencies import Db
from models.enrichment.enrichment_models import EnrichmentModels
from resolver import injectable


@injectable
class EnrichmentModelsPersistence:
    db: Session

    def __init__(self, db: Db):
        self.db = db


    def save(self, lookalike_id: UUID, model: CatBoostRegressor) -> EnrichmentModels:
        new_model = EnrichmentModels(
            lookalike_id=lookalike_id,
            model=model._serialize_model()
        )

        self.db.add(new_model)
        self.db.flush()
        return new_model


    def by_lookalike_id(self, lookalike_id: UUID) -> Optional[EnrichmentModels]:
        stmt = (
            select(EnrichmentModels)
            .select_from(EnrichmentModels)
            .where(EnrichmentModels.lookalike_id == lookalike_id)
        )

        result = self.db.execute(stmt).first()

        if result is None:
            return None

        model, = result
        return model
