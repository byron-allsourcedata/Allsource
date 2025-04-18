from typing import Dict
from typing import List, Annotated

import pandas as pd
from catboost import CatBoostRegressor
from fastapi import Depends
from pandas import DataFrame
from sklearn.model_selection import train_test_split
from typing_extensions import deprecated

from schemas.similar_audiences import AudienceData, AudienceFeatureImportance, NormalizationConfig
from .audience_data_normalization import AudienceDataNormalizationService, AudienceDataNormalizationServiceDep, \
    default_normalization_config


class SimilarAudienceService:
    def __init__(self, audience_data_normalization_service: AudienceDataNormalizationService):
        self.audience_data_normalization_service = audience_data_normalization_service


    @deprecated("Use get_trained_model instead")
    def get_audience_feature_importance(self, audience_data: List[AudienceData]) -> AudienceFeatureImportance:
        audience_data = [d.__dict__ for d in audience_data]
        model = self.get_trained_model(audience_data, default_normalization_config())
        return self.audience_importance(model)


    def get_trained_model(self, audience_data: List[dict], config: NormalizationConfig) -> CatBoostRegressor:
        df = pd.DataFrame(audience_data)
        data, customer_value = self.audience_data_normalization_service.normalize_dataframe(df, config)
        model = self.train_catboost(data, customer_value)
        return model


    def get_audience_feature_importance_with_config(self, audience_data: List[dict], config: NormalizationConfig) -> Dict[str, float]:
        model = self.get_trained_model(audience_data, config)

        feature_importance = pd.DataFrame({
            'Feature': model.feature_names_,
            'Importance': model.get_feature_importance()
        })

        feature_importance['Importance'] = feature_importance['Importance'] / 100

        return dict(zip(
            feature_importance['Feature'],
            feature_importance['Importance']
        ))

    def train_catboost(self, df: DataFrame, amount: DataFrame) -> CatBoostRegressor:
        x = df
        y = amount

        cat_features = x.select_dtypes(include=['object', 'category']).columns.tolist()

        x_train, x_test, y_train, y_test = train_test_split(x, y)
        model = CatBoostRegressor(
            iterations=100,
            learning_rate=0.1,
            depth=6,
            cat_features=cat_features,
            verbose=0
        )

        model.fit(x_train, y_train)

        return model


    def feature_importance(self, model: CatBoostRegressor):
        feature_importance = pd.DataFrame({
            'Feature': model.feature_names_,
            'Importance': model.get_feature_importance()
        })

        feature_importance['Importance'] = feature_importance['Importance'] / 100

        return dict(zip(
            feature_importance['Feature'],
            feature_importance['Importance']
        ))


    def audience_importance(self, model: CatBoostRegressor) -> AudienceFeatureImportance:
        feature_importance_dict = self.feature_importance(model)
        return AudienceFeatureImportance(**feature_importance_dict)


def get_similar_audiences_service(audience_data_normalization_service: AudienceDataNormalizationServiceDep):
    return SimilarAudienceService(audience_data_normalization_service=audience_data_normalization_service)

SimilarAudienceServiceDep = Annotated[AudienceDataNormalizationService, Depends(get_similar_audiences_service)]