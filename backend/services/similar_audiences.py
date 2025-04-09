import os

import pandas as pd
from pandas import DataFrame
from typing import List, Tuple
from sklearn.model_selection import train_test_split
from catboost import CatBoostRegressor

from ..schemas.similar_audiences import AudienceTransaction, AudienceFeatureImportance


class SimilarAudienceService:
    def __init__(self):
        pass

    def get_similarity_scores(self, audience_transactions: List[AudienceTransaction]) -> AudienceFeatureImportance:
        data, amount = self.get_transactions_with_geo(audience_transactions)
        feature_importance = self.train_catboost(data, amount)
        return self.audience_importance(feature_importance)


    def get_dataframe(self, audience_transactions: List[AudienceTransaction]):
        df = pd.DataFrame([t.__dict__ for t in audience_transactions])
        df['ZipCode5'] = pd.to_numeric(df['ZipCode5'], errors='coerce').astype('Int64')
        return df


    def get_backend_dir(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))

        # Walk up the directory tree until we find a directory named 'backend'
        backend_dir = None
        while current_dir != os.path.dirname(current_dir):
            if os.path.basename(current_dir) == 'backend':
                backend_dir = current_dir
                break
            current_dir = os.path.dirname(current_dir)

        return backend_dir

    def from_root(self, path: str) -> str:
        return os.path.join(self.get_backend_dir(), path)


    def get_states_dataframe(self):
        path = self.from_root('data/uszips.csv')
        return pd.read_csv(path, usecols=["zip", "city", "state_name"])


    def train_catboost(self, df: DataFrame, amount: DataFrame) -> DataFrame:
        x = df
        y = amount
        cat_features = x.select_dtypes(include='object').columns.tolist()

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

        importance = feature_importance_df['Importance']

        feature_importance_df['Importance'] = (importance - importance.min()) / (importance.max() - importance.min())

        return feature_importance_df

    def audience_importance(self, feature_importance: DataFrame):
        feature_importance_dict = dict(zip(
            feature_importance['Feature'],
            feature_importance['Importance']
        ))
        return AudienceFeatureImportance(**feature_importance_dict)

    def get_transactions_with_geo(self, audience_transactions: List[AudienceTransaction]) -> Tuple[DataFrame, DataFrame]:
        df_geo = self.get_states_dataframe()
        df = self.get_dataframe(audience_transactions)

        print(df['ZipCode5'].head())
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

