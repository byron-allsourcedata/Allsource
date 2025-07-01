import time
import psycopg2

from typing import List, Any
from uuid import UUID

from catboost import CatBoostRegressor

from pandas import DataFrame
from sqlalchemy import update, select
from sqlalchemy.dialects.postgresql import dialect
from sqlalchemy.orm import Session, Query
from typing_extensions import deprecated

from config.database import SqlConfigBase
from config.util import get_int_env
from db_dependencies import Db
from models import AudienceLookalikes, EnrichmentUser
from persistence.audience_lookalikes import AudienceLookalikesPersistence
from persistence.enrichment_lookalike_scores import (
    EnrichmentLookalikeScoresPersistence,
)
from persistence.enrichment_models import (
    EnrichmentModelsPersistence,
)
from resolver import injectable
from schemas.similar_audiences import NormalizationConfig
from services.similar_audiences.audience_data_normalization import (
    AudienceDataNormalizationService,
)
from services.similar_audiences.column_selector import AudienceColumnSelector


PersonScore = tuple[UUID, float]


def is_uuid(value):
    try:
        UUID(str(value))
        return True
    except ValueError:
        return False


def measure(func):
    start = time.perf_counter()
    result = func(0)
    end = time.perf_counter()
    return result, end - start


def measure_print(func, prefix):
    start = time.perf_counter()
    result = func(0)
    end = time.perf_counter()
    print(f"{prefix}: {end - start:.3f}")
    return result


@injectable
class SimilarAudiencesScoresService:
    enrichment_models_persistence: EnrichmentModelsPersistence
    enrichment_lookalike_scores_persistence: (
        EnrichmentLookalikeScoresPersistence
    )
    normalization_service: AudienceDataNormalizationService
    db: Session

    def __init__(
        self,
        db: Db,
        lookalikes: AudienceLookalikesPersistence,
        column_selector: AudienceColumnSelector,
        enrichment_models_persistence: EnrichmentModelsPersistence,
        enrichment_lookalike_scores_persistence: EnrichmentLookalikeScoresPersistence,
        normalization_service: AudienceDataNormalizationService,
    ):
        self.lookalikes = lookalikes
        self.column_selector = column_selector
        self.enrichment_models_persistence = enrichment_models_persistence
        self.enrichment_lookalike_scores_persistence = (
            enrichment_lookalike_scores_persistence
        )
        self.normalization_service = normalization_service
        self.db = db

    def save_enrichment_model(
        self, lookalike_id: UUID, model: CatBoostRegressor
    ):
        return self.enrichment_models_persistence.save(lookalike_id, model)

    @deprecated("deprecated")
    def calculate_scores(
        self,
        model: CatBoostRegressor,
        lookalike_id: UUID,
        query: Query,
        config: NormalizationConfig,
        user_id_key: str = "user_id",
    ):
        batch_size = 100000

        total = self.db.query(EnrichmentUser).count()

        self.db.execute(
            update(AudienceLookalikes)
            .where(AudienceLookalikes.id == lookalike_id)
            .values(train_model_size=total)
        )
        self.db.commit()

        count = 0

        user_query = select(EnrichmentUser).select_from(EnrichmentUser)
        compiled_user = user_query.compile(dialect=dialect())

        print("preparing cursor")
        url = SqlConfigBase().url
        conn = psycopg2.connect(url)

        cursor = conn.cursor(name="scores_filler_cursor")
        start = time.perf_counter()
        cursor.execute(str(compiled_user))

        print(str(compiled_user))
        end = time.perf_counter()
        print(f"cursor time: {end - start:.3f}")

        total_fetch_time = 0.0
        total_query_time = 0.0
        total_calculation_time = 0.0
        total_insert_time = 0.0
        total_update_time = 0.0

        while True:
            rows, duration = measure(lambda _: cursor.fetchmany(batch_size))
            total_fetch_time += duration
            print(f"fetch time: {duration:.3f}")

            if not rows:
                print("done")
                break

            count += len(rows)
            print(f"fetched from cursor {count}\r")

            dict_rows = [dict(zip(["id", "asid"], row)) for row in rows]

            asids = [rd["asid"] for rd in dict_rows]

            result, duration = measure_print(
                lambda _: (query.where(EnrichmentUser.asid.in_(asids))),
                "query time",
            )
            total_query_time += duration

            feature_dicts = [dict(row._mapping) for row in result]
            user_ids = [rd["id"] for rd in dict_rows]

            scores, duration = measure(
                lambda _: self.calculate_score_dict_batch(
                    model, feature_dicts, config
                )
            )
            total_calculation_time += duration
            print(f"calculation time: {duration:.3f}  - {len(scores)}")

            _, duration = measure(
                lambda _: (
                    self.enrichment_lookalike_scores_persistence.bulk_insert(
                        lookalike_id, list(zip(user_ids, scores))
                    )
                )
            )
            total_insert_time += duration
            print(f"insert time: {duration:.3f}")

            _, duration = measure(
                lambda _: (
                    self.db.execute(
                        update(AudienceLookalikes)
                        .where(AudienceLookalikes.id == lookalike_id)
                        .values(processed_train_model_size=count)
                    )
                )
            )
            total_update_time += duration
            print(f"lookalike update time: {duration:.3f}")
            self.db.commit()
        cursor.close()
        conn.close()
        self.db.commit()
        print("\n=== TOTAL TIMES ===")
        print(f"Total fetch time: {total_fetch_time:.3f} sec")
        print(f"Total query time: {total_query_time:.3f} sec")
        print(f"Total calculation time: {total_calculation_time:.3f} sec")
        print(f"Total insert time: {total_insert_time:.3f} sec")
        print(f"Total update time: {total_update_time:.3f} sec")

    def calculate_score_dict_batch(
        self,
        model: CatBoostRegressor,
        persons: List[dict],
        config: NormalizationConfig,
    ) -> List[float]:
        df = DataFrame(persons)
        return self.calculate_score_batches(model, df, config=config)

    def calculate_score_batches(
        self,
        model: CatBoostRegressor,
        df: DataFrame,
        config: NormalizationConfig,
    ) -> List[float]:
        df_normed, _ = self.normalization_service.normalize_dataframe(
            df, config
        )
        result = model.predict(
            df_normed, thread_count=get_int_env("LOOKALIKE_THREAD_COUNT")
        )
        return result.tolist()

    @deprecated("use v3")
    def calculate_batch_scores_v2(
        self,
        asids: List[UUID],
        batch: list[dict[str, Any]],
        model: CatBoostRegressor,
        lookalike_id: UUID,
        config: NormalizationConfig,
    ) -> tuple[float, float]:
        scores, duration = measure(
            lambda _: self.calculate_score_dict_batch(model, batch, config)
        )

        _, insert_time = measure(
            lambda _: self.enrichment_lookalike_scores_persistence.bulk_insert(
                lookalike_id, list(zip(asids, scores))
            )
        )

        return duration, insert_time

    def calculate_batch_scores_v3(
        self,
        asids: list[UUID],
        batch: list[dict[str, Any]],
        model: CatBoostRegressor,
        config: NormalizationConfig,
    ) -> tuple[float, list[PersonScore]]:
        scores, duration = measure(
            lambda _: self.calculate_score_dict_batch(model, batch, config)
        )

        return duration, list(zip(asids, scores))

    def top_scores(
        self,
        old_scores: list[tuple[UUID, float]],
        new_scores: list[tuple[UUID, float]],
        top_n: int,
    ) -> list[PersonScore]:
        combined = {}

        for uuid_, score in old_scores + new_scores:
            if uuid_ not in combined or score > combined[uuid_]:
                combined[uuid_] = score

        return sorted(combined.items(), key=lambda x: x[1], reverse=True)[
            :top_n
        ]

    @deprecated("deprecated")
    def calculate_batch_scores(
        self,
        asids: List[UUID],
        batch: list[dict[str, Any]],
        model: CatBoostRegressor,
        lookalike_id: UUID,
    ) -> tuple[float, float]:
        config = self.prepare_config(lookalike_id)
        return self.calculate_batch_scores_v2(
            asids=asids,
            batch=batch,
            model=model,
            lookalike_id=lookalike_id,
            config=config,
        )

    def prepare_config(self, lookalike_id: UUID) -> NormalizationConfig:
        lookalike = self.lookalikes.get_lookalike(lookalike_id)
        return self.get_config(lookalike.significant_fields)

    def get_config(self, significant_fields: dict):
        column_names = self.column_selector.clickhouse_columns(
            significant_fields
        )
        column_names = list(set(column_names))
        column_names = [
            column for column in column_names if column != "zip_code5"
        ]
        return NormalizationConfig(
            ordered_features={},
            numerical_features=[],
            unordered_features=column_names,
        )


SimilarAudiencesServiceDep = SimilarAudiencesScoresService
