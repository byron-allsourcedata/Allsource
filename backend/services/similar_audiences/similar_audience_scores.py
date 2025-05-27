import time
import psycopg2
from decimal import Decimal
from typing import List
from uuid import UUID

from catboost import CatBoostRegressor
from fastapi import Depends
from pandas import DataFrame
from sqlalchemy import update, func, text, select
from sqlalchemy.dialects.postgresql import dialect
from sqlalchemy.orm import Session, Query
from typing_extensions import Annotated

from config.database import SqlConfigBase
from dependencies import Db
from models import AudienceLookalikes, EnrichmentUserContact, EnrichmentUser
from persistence.enrichment_lookalike_scores import EnrichmentLookalikeScoresPersistence, \
    EnrichmentLookalikeScoresPersistenceDep
from persistence.enrichment_models import EnrichmentModelsPersistence, EnrichmentModelsPersistenceDep
from schemas.similar_audiences import NormalizationConfig, AudienceData
from services.similar_audiences.audience_data_normalization import AudienceDataNormalizationService, \
    default_normalization_config, AudienceDataNormalizationServiceDep


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


class SimilarAudiencesScoresService:
    enrichment_models_persistence: EnrichmentModelsPersistence
    enrichment_lookalike_scores_persistence: EnrichmentLookalikeScoresPersistence
    normalization_service: AudienceDataNormalizationService
    db: Session

    def __init__(self, db: Session, enrichment_models_persistence: EnrichmentModelsPersistence, enrichment_lookalike_scores_persistence: EnrichmentLookalikeScoresPersistence, 
                 normalization_service: AudienceDataNormalizationService):
        self.enrichment_models_persistence = enrichment_models_persistence
        self.enrichment_lookalike_scores_persistence = enrichment_lookalike_scores_persistence
        self.normalization_service = normalization_service
        self.db = db
    
    
    def save_enrichment_model(self, lookalike_id: UUID, model: CatBoostRegressor):
        return self.enrichment_models_persistence.save(lookalike_id, model)


    def calculate_scores(self, model: CatBoostRegressor, lookalike_id: UUID, query: Query, config: NormalizationConfig, user_id_key: str = 'user_id'):
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

        while True:
            rows, duration = measure(lambda _: cursor.fetchmany(batch_size))
            print(f"fetch time: {duration:.3f}")

            if not rows:
                print("done")
                break

            count += len(rows)
            print(f"fetched from cursor {count}\r")


            dict_rows = [dict(zip(['id', 'asid'], row)) for row in rows]

            asids = [rd['asid'] for rd in dict_rows]

            result = measure_print(lambda _: (
                query.where(EnrichmentUser.asid.in_(asids))
            ), "query time")

            feature_dicts = [dict(row._mapping) for row in result]
            user_ids = [rd['id'] for rd in dict_rows]

            scores, duration = measure(lambda _: self.calculate_score_dict_batch(model, feature_dicts, config))
            print(f"calculation time: {duration:.3f}")

            _, duration = measure(lambda _: (
                self.enrichment_lookalike_scores_persistence.bulk_insert(
                    lookalike_id,
                    list(zip(user_ids, scores))
                )
            ))
            print(f"insert time: {duration:.3f}")

            _, duration = measure(lambda _: (
                self.db.execute(
                    update(AudienceLookalikes)
                    .where(AudienceLookalikes.id == lookalike_id)
                    .values(processed_train_model_size=count)
                )
            ))
            print(f"lookalike update time: {duration:.3f}")
            self.db.commit()
        cursor.close()
        conn.close()



        self.db.commit()



    def calculate_score_dict_batch(self, model: CatBoostRegressor, persons: List[dict], config: NormalizationConfig) -> List[float]:
        df = DataFrame(persons)
        return self.calculate_score_batches(model, df, config=config)

    def calculate_score_batches(self, model: CatBoostRegressor, df: DataFrame, config: NormalizationConfig) -> List[
        float]:
        df_normed, _ = self.normalization_service.normalize_dataframe(df, config)
        result = model.predict(df_normed)
        return result.tolist()





def get_similar_audiences_service(db: Db, models: EnrichmentModelsPersistenceDep, scores: EnrichmentLookalikeScoresPersistenceDep, normalization: AudienceDataNormalizationServiceDep) -> SimilarAudiencesScoresService:
    return SimilarAudiencesScoresService(db=db, models=models, scores=scores, normalization=normalization)


SimilarAudiencesServiceDep = Annotated[SimilarAudiencesScoresService, Depends(get_similar_audiences_service)]