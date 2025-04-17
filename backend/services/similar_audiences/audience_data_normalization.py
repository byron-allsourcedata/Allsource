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
        numerical_features=['PersonExactAge', 'NumberOfChildren', 'LengthOfResidenceYears'],
        unordered_features=[
            'PersonGender', 'HasChildren','HomeownerStatus', 'MaritalStatus',
            'HasCreditCard', 'OccupationGroupCode', 'IsBookReader',
            'IsOnlinePurchaser', 'IsTraveler'
        ],
        ordered_features={
            'EstimatedHouseholdIncomeCode': map_letter_to_number,
            'EstimatedCurrentHomeValueCode': map_letter_to_number,
            'CreditRating': map_credit_rating,
            'NetWorthCode': map_net_worth_code
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
        if 'ZipCode5' in df.columns:
            df['ZipCode3'] = df['ZipCode5'].str[:3]
            df['ZipCode4'] = df['ZipCode5'].str[:4]


    def fill_unknowns(self, df: DataFrame, cat_columns: List[str]):
        for cat in cat_columns:
            df.loc[:, cat] = df[cat].fillna('U')

        if 'PersonExactAge' in df.columns:
            df['PersonExactAge'] = df['PersonExactAge'].fillna(df['PersonExactAge'].median())
        if 'NumberOfChildren' in df.columns:
            df['NumberOfChildren'] = df['NumberOfChildren'].fillna(0)
        if 'LengthOfResidenceYears' in df.columns:
            df['LengthOfResidenceYears'] = df['LengthOfResidenceYears'].fillna(0)


    def fill_unknown_geo(self, df: DataFrame):
        df.loc[:, 'state_name'] = df['state_name'].fillna('unknown')
        df.loc[:, 'state_city'] = df['state_city'].fillna('unknown')


    def merge_with_geo(self, df: DataFrame) -> DataFrame:
        df_geo = self.get_states_dataframe()

        df_with_geo = df.merge(df_geo, how='left', left_on='ZipCode5', right_on='zip')
        df_with_geo['state_city'] = df_with_geo['state_name'] + '|' + df_with_geo['city']

        return df_with_geo


    def filter_columns(self, df_with_geo: DataFrame, config: NormalizationConfig):
        cat_columns = config.unordered_features
        ordered_features = list(config.ordered_features.keys())
        numerical_features = config.numerical_features


        cat_indicator_columns = [name + 'IsMissing' for name in cat_columns]

        zipcodes = [f"ZipCode{n}" for n in [3, 4, 5]]

        valid_columns = ([
             'state_name', 'state_city'
        ] + numerical_features + ordered_features + zipcodes + cat_columns + cat_indicator_columns)

        df_final = df_with_geo[valid_columns]
        value = df_with_geo['customer_value']

        return df_final, value

    def get_audience_dataframe(self, audience_data: List[AudienceData]):
        df = pd.DataFrame([t.__dict__ for t in audience_data])

        df['ZipCode5'] = df['ZipCode5'].astype('object')
        return df

    def get_states_dataframe(self) -> DataFrame:
        path = Folders.data('uszips.csv')
        dataframe = pd.read_csv(path, usecols=["zip", "city", "state_name"], dtype={"zip": str})
        return dataframe


def get_audience_data_normalization_service():
    return AudienceDataNormalizationService()

AudienceDataNormalizationServiceDep = Annotated[AudienceDataNormalizationService, Depends(get_audience_data_normalization_service)]