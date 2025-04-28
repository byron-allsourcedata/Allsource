import string
from typing import List, Annotated, Tuple

import pandas as pd
from fastapi import Depends
from pandas import DataFrame

from config.folders import Folders
from schemas.similar_audiences import AudienceData, NormalizationConfig, OrderedFeatureRules

letter_to_number = {
    ch: (None if ch == 'U' else i + 1)
    for i, ch in enumerate(string.ascii_uppercase)
}

letter_to_number_E = {
    ch: (0 if ch == 'U' else 5 - i)
    for i, ch in enumerate(string.ascii_uppercase[:5] + 'U')
}


letter_to_number_I = {
    ch: (None if ch == 'U' else i + 1)
    for i, ch in enumerate(string.ascii_uppercase[:9] + 'U')
}

def convert_to_int(val):
    if val == '' or pd.isna(val):
        return None
    try:
        return int(val)
    except ValueError:
        return None


def map_letter_to_number(letter: str):
    return letter_to_number.get(letter)

def map_credit_rating(letter: str):
    return letter_to_number_E.get(letter)

def map_net_worth_code(letter: str):
    return letter_to_number_I.get(letter)




def default_normalization_config() -> NormalizationConfig:
    return NormalizationConfig(
        numerical_features=['age', 'number_of_children', 'length_of_residence_years'],
        unordered_features=[
            'gender', 'has_children','homeowner', 'marital_status',
            'book_reader', 'online_purchaser', 'travel'
        ],
        ordered_features={
            # 'EstimatedHouseholdIncomeCode': map_letter_to_number,
            # 'EstimatedCurrentHomeValueCode': map_letter_to_number,
            'credit_rating': map_credit_rating,
            'net_worth': map_net_worth_code
        }
    )


class AudienceDataNormalizationService:
    def normalize(self, audience_data: List[AudienceData]) -> Tuple[DataFrame, DataFrame]:
        df = self.get_audience_dataframe(audience_data)
        return self.normalize_dataframe(df=df, config=default_normalization_config())


    def normalize_dataframe(self, df: DataFrame, config: NormalizationConfig) -> Tuple[DataFrame, DataFrame]:
        self.convert_int_columns(df, config.numerical_features)
        self.convert_categorials(df, config.unordered_features)
        self.add_missing_indicators(df, config.unordered_features)
        self.convert_ordered_features(df, config.ordered_features)
        self.slice_zipcodes(df)
        self.fill_unknowns(df, config.unordered_features)

        df = self.merge_with_geo(df)
        self.fill_unknown_geo(df)
        x, y = self.filter_columns(df, config)
        return x, y


    def convert_int_columns(self, df: DataFrame, int_columns: List[str]):
        for name in int_columns:
            df[name] = df[name].map(convert_to_int).astype('Int64')


    def convert_categorials(self, df: DataFrame, cat_columns: List[str]):
        for name in cat_columns:
            df[name] = df[name].astype('object')


    def add_missing_indicators(self, df: DataFrame, cat_columns: List[str]):
        for name in cat_columns:
            df[name + 'IsMissing'] = (df[name] == 'U').astype('object')


    def convert_ordered_features(self, df: DataFrame, rules: OrderedFeatureRules):
        for name, operation in rules.items():
            df[name] = df[name].map(operation).astype('Int64')


    def slice_zipcodes(self, df: DataFrame):
        if 'zip_code5' in df.columns:
            df['zip_code3'] = df['zip_code5'].str[:3]
            df['zip_code4'] = df['zip_code5'].str[:4]


    def fill_unknowns(self, df: DataFrame, cat_columns: List[str]):
        for cat in cat_columns:
            df.loc[:, cat] = df[cat].fillna('U').astype(str).infer_objects(copy=False)

        if 'age' in df.columns:
            df["age"] = pd.to_numeric(df["age"], errors="coerce")
            median_age = df["age"].median(skipna=True)
            df["age"] = df["age"].fillna(median_age)
        if 'number_of_children' in df.columns:
            df['number_of_children'] = df['number_of_children'].fillna(0)
        if 'length_of_residence_years' in df.columns:
            df['length_of_residence_years'] = df['length_of_residence_years'].fillna(0)


    def fill_unknown_geo(self, df: DataFrame):
        df.loc[:, 'state_name'] = df['state_name'].fillna('unknown')
        df.loc[:, 'state_city'] = df['state_city'].fillna('unknown')


    def merge_with_geo(self, df: DataFrame) -> DataFrame:
        df_geo = self.get_states_dataframe()

        df_with_geo = df.merge(df_geo, how='left', left_on='zip_code5', right_on='zip')
        df_with_geo['state_city'] = df_with_geo['state_name'] + '|' + df_with_geo['city']

        return df_with_geo


    def filter_columns(self, df_with_geo: DataFrame, config: NormalizationConfig):
        cat_columns = config.unordered_features
        ordered_features = list(config.ordered_features.keys())
        numerical_features = config.numerical_features


        cat_indicator_columns = [name + 'IsMissing' for name in cat_columns]

        zipcodes = [f"zip_code{n}" for n in [3, 4, 5]]

        valid_columns = ([
             'state_name', 'state_city'
        ] + numerical_features + ordered_features + zipcodes + cat_columns + cat_indicator_columns)

        df_final = df_with_geo[valid_columns]

        value = None
        if 'customer_value' in df_with_geo.columns:
            value = df_with_geo['customer_value']

        return df_final, value

    def get_audience_dataframe(self, audience_data: List[AudienceData]):
        df = pd.DataFrame([t.__dict__ for t in audience_data])

        df['zip_code5'] = df['zip_code5'].astype('object')
        return df

    def get_states_dataframe(self) -> DataFrame:
        path = Folders.data('uszips.csv')
        dataframe = pd.read_csv(path, usecols=["zip", "city", "state_name"], dtype={"zip": str})
        return dataframe


def get_audience_data_normalization_service():
    return AudienceDataNormalizationService()

AudienceDataNormalizationServiceDep = Annotated[AudienceDataNormalizationService, Depends(get_audience_data_normalization_service)]