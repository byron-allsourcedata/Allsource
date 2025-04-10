import pandas as pd
from pandas import DataFrame
from typing import List, Tuple, Annotated
from sklearn.model_selection import train_test_split
from catboost import CatBoostRegressor
from fastapi import Depends

from .audience_data_normalization import AudienceDataNormalizationService, AudienceDataNormalizationServiceDep
from ...config.folders import Folders
from ...schemas.similar_audiences import AudienceData, AudienceFeatureImportance



class SimilarAudienceService:
    def __init__(self, normalizer: AudienceDataNormalizationService):
        self.normalizer = normalizer


    def get_audience_feature_importance(self, audience_data: List[AudienceData]) -> AudienceFeatureImportance:
        data, amount = self.get_transactions_with_geo(audience_data)
        feature_importance = self.train_catboost(data, amount)
        return self.audience_importance(feature_importance)


    def get_transactions_with_geo(self, audience_data: List[AudienceData]) -> Tuple[DataFrame, DataFrame]:
        df_geo = self.get_states_dataframe()
        df = self.get_dataframe(audience_data)

        df_with_geo = df.merge(df_geo, how='left', left_on='ZipCode5', right_on='zip')
        df_with_geo['state_city'] = df_with_geo['state_name'] + '|' + df_with_geo['city']
        df_final = df_with_geo[
            ['PersonExactAge', 'PersonGender', 'EstimatedHouseholdIncomeCode', 'EstimatedCurrentHomeValueCode',
             'HomeownerStatus', 'HasChildren', 'NumberOfChildren', 'CreditRating', 'NetWorthCode', 'HasCreditCard',
             'LengthOfResidenceYears', 'MaritalStatus', 'OccupationGroupCode', 'IsBookReader', 'IsOnlinePurchaser',
             'IsTraveler', 'state_name', 'state_city']]
        df_final.loc[:, 'state_name'] = df_final['state_name'].fillna('unknown')
        df_final.loc[:, 'state_city'] = df_final['state_city'].fillna('unknown')

        amount = df_with_geo['amount']

        return df_final, amount


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


    def get_dataframe(self, audience_data: List[AudienceData]):
        return self.normalizer.normalize(audience_data)


    def get_states_dataframe(self) -> DataFrame:
        path = Folders.data('uszips.csv')
        dataframe = pd.read_csv(path, usecols=["zip", "city", "state_name"], dtype={"zip": str})
        return dataframe


def get_similar_audiences_service(normalizer: AudienceDataNormalizationServiceDep):
    return SimilarAudienceService(normalizer=normalizer)

SimilarAudienceServiceDep = Annotated[AudienceDataNormalizationService, Depends(get_similar_audiences_service)]