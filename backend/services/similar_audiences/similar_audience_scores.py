from decimal import Decimal
from typing import List
from uuid import UUID

import numpy as np
from catboost import CatBoostRegressor
from fastapi import Depends
from pandas import DataFrame
from sqlalchemy.dialects.postgresql import dialect
from sqlalchemy.orm import Session, Query
from typing_extensions import Annotated

from dependencies import Db
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
    models: EnrichmentModelsPersistence
    scores: EnrichmentLookalikeScoresPersistence
    normalization: AudienceDataNormalizationService
    db: Session

    def __init__(self, db: Session, models: EnrichmentModelsPersistence, scores: EnrichmentLookalikeScoresPersistence, normalization: AudienceDataNormalizationService):
        self.models = models
        self.scores = scores
        self.normalization = normalization
        self.db = db


    def calculate_scores(self, lookalike_id: UUID, query: Query, config: NormalizationConfig, user_id_key: str = 'user_id'):
        compiled = query.statement.compile(dialect=dialect(), compile_kwargs={"literal_binds": True})

        enrichment_model = self.models.by_lookalike_id(lookalike_id)
        if enrichment_model is None:
            raise ValueError("No model found for lookalike_id")

        model = CatBoostRegressor().load_model(blob=enrichment_model.model)

        count = 0
        with self.db.connection() as conn:
            with conn.connection.cursor() as cursor:
                cursor.execute(str(compiled))
                columns = [desc[0] for desc in cursor.description]

                print("columns:" + str(columns))
                while True:
                    rows = cursor.fetchmany(10000)

                    if not rows:
                        print("done")
                        break


                    count += len(rows)
                    print(f"fetched {count}\r")

                    dict_rows = [dict(zip(columns, row)) for row in rows]
                    ad = [AudienceData(
                        EmailAddress=row.get('EmailAddress'),
                        PersonExactAge=str(row.get('age', '')),
                        PersonGender=str(row.get('PersonGender', '')),
                        EstimatedHouseholdIncomeCode=str(row.get('EstimatedHouseholdIncomeCode', '')),
                        EstimatedCurrentHomeValueCode=str(row.get('EstimatedCurrentHomeValueCode', '')),
                        HomeownerStatus=str(row.get('HomeownerStatus', '')),
                        HasChildren=str(row.get('HasChildren', '')),
                        NumberOfChildren=str(row.get('NumberOfChildren', '')),
                        CreditRating=str(row.get('CreditRating', '')),
                        NetWorthCode=str(row.get('NetWorthCode', '')),
                        ZipCode5=str(row.get('ZipCode5', '')),
                        Latitude=str(row.get('Latitude', '')),
                        Longitude=str(row.get('Longitude', '')),
                        HasCreditCard=str(row.get('HasCreditCard', '')),
                        LengthOfResidenceYears=str(row.get('LengthOfResidenceYears', '')),
                        MaritalStatus=str(row.get('MaritalStatus', '')),
                        OccupationGroupCode=row.get('OccupationGroupCode'),
                        IsBookReader=str(row.get('IsBookReader', '')),
                        IsOnlinePurchaser=str(row.get('IsOnlinePurchaser', '')),
                        StateAbbr=str(row.get('StateAbbr', '')),
                        IsTraveler=str(row.get('IsTraveler', '')),
                        customer_value=Decimal(0.0)
                    ).__dict__ for row in dict_rows]

                    scores = self.calculate_score_dict_batch(model, ad, config)
                    user_ids: List[UUID] = [row[user_id_key] for row in dict_rows]


                    self.scores.bulk_insert(lookalike_id, list(zip(user_ids, scores)))

                    print("done insert")
                    self.db.flush()
                    self.db.commit()


        self.db.commit()


    def calculate_score_dict_batch(self, model: CatBoostRegressor, persons: List[dict], config: NormalizationConfig) -> List[float]:
        df = DataFrame(persons)
        return self.calculate_score_batches(model, df, config=config)


    def calculate_score_batches(self, model: CatBoostRegressor, persons: DataFrame, config: NormalizationConfig) -> List[float]:
        persons, values = self.normalization.normalize_dataframe(persons, config=config)
        result: np.ndarray = model.predict(persons)

        return result.tolist()





def get_similar_audiences_service(db: Db, models: EnrichmentModelsPersistenceDep, scores: EnrichmentLookalikeScoresPersistenceDep, normalization: AudienceDataNormalizationServiceDep) -> SimilarAudiencesScoresService:
    return SimilarAudiencesScoresService(db=db, models=models, scores=scores, normalization=normalization)


SimilarAudiencesServiceDep = Annotated[SimilarAudiencesScoresService, Depends(get_similar_audiences_service)]