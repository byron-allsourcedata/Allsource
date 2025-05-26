from decimal import Decimal
from typing import (
    List,
    Dict,
    Any, Tuple
)
from uuid import UUID

from catboost import CatBoostRegressor
from pandas import DataFrame

from persistence.audience_lookalikes import AudienceLookalikesPersistence
from persistence.enrichment_lookalike_scores import EnrichmentLookalikeScoresPersistence
from persistence.enrichment_models import EnrichmentModelsPersistence
from resolver import injectable
from schemas.similar_audiences import NormalizationConfig
from services.similar_audiences.audience_data_normalization import AudienceDataNormalizationService
from services.similar_audiences.column_selector import AudienceColumnSelector


def is_uuid(value):
    try:
        UUID(str(value))
        return True
    except ValueError:
        return False


@injectable
class SimilarAudiencesScoresService:
    enrichment_models_persistence: EnrichmentModelsPersistence
    enrichment_lookalike_scores_persistence: EnrichmentLookalikeScoresPersistence
    normalization_service: AudienceDataNormalizationService
    column_selector: AudienceColumnSelector

    def __init__(
        self,
        enrichment_models_persistence: EnrichmentModelsPersistence,
        enrichment_lookalike_scores_persistence: EnrichmentLookalikeScoresPersistence,
        normalization_service: AudienceDataNormalizationService,
        column_selector: AudienceColumnSelector,
        lookalikes: AudienceLookalikesPersistence
    ):
        self.enrichment_models_persistence = enrichment_models_persistence
        self.enrichment_lookalike_scores_persistence = enrichment_lookalike_scores_persistence
        self.normalization_service = normalization_service
        self.column_selector = column_selector
        self.lookalikes= lookalikes


    def save_enrichment_model(self, lookalike_id: UUID, model: CatBoostRegressor):
        return self.enrichment_models_persistence.save(lookalike_id, model)


    def get_lookalike_scores(
        self,
        source_uuid: UUID,
        lookalike_id: UUID,
        total_rows: int
    ) -> List[Tuple[UUID, Decimal]]:
        return self.enrichment_lookalike_scores_persistence.get_lookalike_scores(source_uuid, lookalike_id, total_rows)

    def calculate_batch_scores(
        self,
        enrichment_user_ids: List[UUID],
        batch: List[Dict[str, Any]],
        model: CatBoostRegressor,
        lookalike_id: UUID
    ):
        lookalike = self.lookalikes.get_lookalike(lookalike_id)
        config = self.get_config(lookalike.significant_fields)

        scores = self.calculate_score_dict_batch(model, batch, config)
        self.enrichment_lookalike_scores_persistence.bulk_insert(lookalike_id, list(zip(enrichment_user_ids, scores)))
        self.enrichment_lookalike_scores_persistence.commit()


    def get_config(self, significant_fields: dict):
        column_names = self.column_selector.clickhouse_columns(significant_fields)
        column_names = list(set(column_names))
        column_names = [column for column in column_names if column != "zip_code5"]
        return NormalizationConfig(
            ordered_features={},
            numerical_features=[],
            unordered_features=column_names
        )

    def calculate_score_dict_batch(self, model: CatBoostRegressor, persons: List[dict], config: NormalizationConfig) -> List[float]:
        df = DataFrame(persons)
        return self.calculate_score_batches(model, df, config=config)

    def calculate_score_batches(self, model: CatBoostRegressor, df: DataFrame, config: NormalizationConfig) -> List[
        float]:
        df_normed, _ = self.normalization_service.normalize_dataframe(df, config)
        result = model.predict(df_normed)
        return result.tolist()

