from typing import Dict
from typing import List, Annotated

import pandas as pd
from catboost import CatBoostRegressor, CatBoostError, Pool
from fastapi import Depends
from pandas import DataFrame
from sklearn.model_selection import train_test_split
from typing_extensions import deprecated

from resolver import injectable
from schemas.similar_audiences import AudienceData, AudienceFeatureImportance, NormalizationConfig
from .audience_data_normalization import AudienceDataNormalizationService, AudienceDataNormalizationServiceDep, \
    default_normalization_config
from .exceptions import EqualTrainTargets, EmptyTrainDataset

pd.set_option('future.no_silent_downcasting', True)

@injectable
class SimilarAudienceService:
    def __init__(self, audience_data_normalization_service: AudienceDataNormalizationService):
        self.audience_data_normalization_service = audience_data_normalization_service


    @deprecated("Use get_trained_model instead")
    def get_audience_feature_importance(self, audience_data: List[AudienceData]) -> AudienceFeatureImportance:
        audience_data = [d.__dict__ for d in audience_data]
        model = self.get_trained_model(audience_data, default_normalization_config())
        return self.audience_importance(model)


    def get_trained_model(self, audience_data: List[dict], config: NormalizationConfig) -> CatBoostRegressor:
        if len(audience_data) == 0:
            raise EmptyTrainDataset("Empty train dataset")

        df = pd.DataFrame(audience_data)
        data, customer_value = self.audience_data_normalization_service.normalize_dataframe(df, config)
        model = self.train_catboost(data, customer_value)
        return model


    def get_audience_feature_importance_with_config(self, audience_data: List[dict], config: NormalizationConfig) -> Dict[str, float]:
        model, x_train = self.get_trained_model(audience_data, config)

        feature_importance = pd.DataFrame({
            'Feature': model.feature_names_,
            'Importance': model.get_feature_importance(data=x_train)
        })

        feature_importance['Importance'] = feature_importance['Importance'] / 100

        return dict(zip(
            feature_importance['Feature'],
            feature_importance['Importance']
        ))

    def safe_fillna_numeric(self, df: DataFrame, numeric_cols: List[str]):
        for col in numeric_cols:
            non_null = df[col].dropna()
            if not non_null.empty:
                fill = non_null.mean()
            else:
                fill = 0
            df[col].fillna(fill, inplace=True)
        df = df.infer_objects(copy=False)
        return df

    def train_catboost(self, df: DataFrame, amount: DataFrame) -> CatBoostRegressor:
        x = df
        y = amount

        cat_features = x.select_dtypes(include=['object', 'category']).columns.tolist()
        if cat_features:
            x[cat_features] = (
                x[cat_features]
                .fillna("NA")
                .astype(str)
                .infer_objects(copy=False)
            )

        x_train, x_test, y_train, y_test = train_test_split(x, y)
        train_pool = Pool(x_train, label=y_train, cat_features=cat_features)
        model = CatBoostRegressor(
            iterations=100,
            learning_rate=0.1,
            depth=6,
            cat_features=cat_features,
            verbose=0
        )

        try:
            model.fit(train_pool)
        except CatBoostError as e:
            if "All train targets are equal" in str(e):
                value = y_train.iloc[0]
                raise EqualTrainTargets(
                    f"All train targets are equal - customer value is same ({value}) for all rows, check if your data is valid)")

        return model, train_pool


    def feature_importance(self, model: CatBoostRegressor, x_train):
        feature_importance = pd.DataFrame({
            'Feature': model.feature_names_,
            'Importance': model.get_feature_importance(data=x_train)
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