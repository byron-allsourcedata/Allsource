import time
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
        total = self.db.query(EnrichmentUser).count()

        self.db.execute(
            update(AudienceLookalikes)
            .where(AudienceLookalikes.id == lookalike_id)
            .values(train_model_size=total)
        )
        self.db.commit()

        compiled = query.statement.compile(
            dialect=dialect(),
            compile_kwargs={"literal_binds": True}
        )

        count = 0


        user_query = select(EnrichmentUser).select_from(EnrichmentUser)

        compiled_user = user_query.compile(dialect=dialect())



        with self.db.connection() as conn:
            conn.execution_options(stream_results=True)
            with conn.connection.cursor() as cursor:

                cursor.execute("SET enable_hashjoin = off")
                print("preparing cursor")

                start = time.perf_counter()
                print(str(compiled_user))
                # conn.execution_options(stream_results=False)
                cursor.execute(str(compiled_user))
                end = time.perf_counter()
                print(f"query time: {end - start}")

                columns = [desc[0] for desc in cursor.description]

                while True:
                    conn.execution_options(stream_results=True)
                    start = time.perf_counter()

                    rows = cursor.fetchmany(10000)
                    end = time.perf_counter()
                    conn.execution_options(stream_results=False)

                    result = end- start
                    print(f"fetch time: {result:.3f}")

                    if not rows:
                        print("done")
                        break

                    count += len(rows)
                    print(f"fetched from cursor {count}\r")

                    start = time.perf_counter()
                    dict_rows = [dict(zip(columns, row)) for row in rows]

                    asids = [rd['asid'] for rd in dict_rows]


                    result = query.where(EnrichmentUser.asid.in_(asids))
                    feature_dicts = [dict(row._mapping) for row in result]
                    user_ids = [rd['id'] for rd in dict_rows]



                    # feature_dicts = []
                    # for rd in dict_rows:
                    #     user_ids.append(rd[user_id_key])
                    #     feats = {
                    #         k: (str(v) if v is not None else "None")
                    #         for k, v in rd.items()
                    #         if k != user_id_key
                    #     }
                    #     feature_dicts.append(feats)


                    scores = self.calculate_score_dict_batch(model, feature_dicts, config)

                    end = time.perf_counter()
                    result = end - start
                    print(f"calculation time: {result:.3f}")
                    start = time.perf_counter()
                    self.enrichment_lookalike_scores_persistence.bulk_insert(lookalike_id, list(zip(user_ids, scores)))

                    end = time.perf_counter()
                    result = end - start
                    print(f"insert time: {result:.3f}")

                    start = time.perf_counter()
                    self.db.execute(
                        update(AudienceLookalikes)
                        .where(AudienceLookalikes.id == lookalike_id)
                        .values(processed_train_model_size=count)
                    )

                    end = time.perf_counter()
                    result = end - start
                    print(f"lookalike update time: {result:.3f}")
                    self.db.commit()
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