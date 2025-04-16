from typing import List, Annotated, Dict

import pandas as pd
from catboost import CatBoostRegressor
from fastapi import Depends
from pandas import DataFrame
from sklearn.model_selection import train_test_split

from schemas.similar_audiences import AudienceData, AudienceFeatureImportance, NormalizationConfig
from .audience_data_normalization import AudienceDataNormalizationService, AudienceDataNormalizationServiceDep


class SimilarAudienceService:
    def __init__(self, normalizer: AudienceDataNormalizationService):
        self.normalizer = normalizer


    def get_audience_feature_importance(self, audience_data: List[AudienceData]) -> AudienceFeatureImportance:
        data, customer_value = self.normalizer.normalize(audience_data)
        feature_importance = self.train_catboost(data, customer_value)
        return self.audience_importance(feature_importance)



    def get_audience_feature_importance_with_config(self, audience_data: List[dict], config: NormalizationConfig) -> Dict[str, float]:
        df = pd.DataFrame(audience_data)
        data, customer_value = self.normalizer.normalize_dataframe(df, config)
        feature_importance = self.train_catboost(data, customer_value)
        return dict(zip(
            feature_importance['Feature'],
            feature_importance['Importance']
        ))

    def train_catboost(self, df: DataFrame, amount: DataFrame) -> DataFrame:
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

        feature_importance_df = pd.DataFrame({
            'Feature': model.feature_names_,
            'Importance': model.get_feature_importance()
        })

        feature_importance_df['Importance'] = feature_importance_df['Importance'] / 100

        return feature_importance_df


    def audience_importance(self, feature_importance: DataFrame) -> AudienceFeatureImportance:
        feature_importance_dict = dict(zip(
            feature_importance['Feature'],
            feature_importance['Importance']
        ))
        return AudienceFeatureImportance(**feature_importance_dict)


def get_similar_audiences_service(normalizer: AudienceDataNormalizationServiceDep):
    return SimilarAudienceService(normalizer=normalizer)

SimilarAudienceServiceDep = Annotated[AudienceDataNormalizationService, Depends(get_similar_audiences_service)]