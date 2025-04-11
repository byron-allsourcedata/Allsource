import string
from typing import List, Annotated, Tuple

import pandas as pd
from pandas import DataFrame

from backend.config.folders import Folders
from backend.schemas.similar_audiences import AudienceData
from fastapi import Depends

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

class AudienceDataNormalizationService:
    def __init__(self):
        self.int_columns = ['PersonExactAge','NumberOfChildren', 'LengthOfResidenceYears']
        self.cat_columns = [
            'PersonGender', 'HasChildren','HomeownerStatus', 'MaritalStatus',
            'HasCreditCard', 'OccupationGroupCode', 'IsBookReader',
            'IsOnlinePurchaser', 'IsTraveler'
        ]

    def normalize(self, audience_data: List[AudienceData]) -> Tuple[DataFrame, DataFrame]:
        df = self.get_audience_dataframe(audience_data)

        self.convert_int_columns(df, self.int_columns)
        self.convert_categorials(df, self.cat_columns)
        self.add_missing_indicators(df, self.cat_columns)
        self.convert_ordered_features(df)
        self.slice_zipcodes(df)
        self.fill_unknowns(df)

        df = self.merge_with_geo(df)
        self.fill_unknown_geo(df)
        x, y = self.filter_columns(df)
        return x, y


    def convert_int_columns(self, df: DataFrame, int_columns: List[str]):
        for name in int_columns:
            df[name] = df[name].map(convert_to_int).astype('Int64')


    def convert_categorials(self, df: DataFrame, cat_columns: List[str]):
        for name in cat_columns:
            df[name] = df[name].astype('category')


    def add_missing_indicators(self, df: DataFrame, cat_columns: List[str]):
        for name in cat_columns:
            df[name + 'IsMissing'] = (df[name] == 'U').astype('object')


    def convert_ordered_features(self, df: DataFrame):
        df['EstimatedHouseholdIncomeCode'] = df['EstimatedHouseholdIncomeCode'].map(letter_to_number).astype('Int64')
        df['EstimatedCurrentHomeValueCode'] = df['EstimatedCurrentHomeValueCode'].map(letter_to_number).astype('Int64')
        df['CreditRating'] = df['CreditRating'].map(letter_to_number_E).astype('Int64')
        df['NetWorthCode'] = df['NetWorthCode'].map(letter_to_number_I).astype('Int64')


    def slice_zipcodes(self, df: DataFrame):
        df['ZipCode3'] = df['ZipCode5'].str[:3]
        df['ZipCode4'] = df['ZipCode5'].str[:4]


    def fill_unknowns(self, df: DataFrame):
        # for cat in self.cat_columns:
        #     df.loc[:, cat] = df[cat].fillna('U')

        # df['PersonExactAge'] = df['PersonExactAge'].fillna(df['PersonExactAge'].median())
        df['NumberOfChildren'] = df['NumberOfChildren'].fillna(0)
        df['LengthOfResidenceYears'] = df['LengthOfResidenceYears'].fillna(0)


    def fill_unknown_geo(self, df: DataFrame):
        df.loc[:, 'state_name'] = df['state_name'].fillna('unknown')
        df.loc[:, 'state_city'] = df['state_city'].fillna('unknown')


    def merge_with_geo(self, df: DataFrame) -> DataFrame:
        df_geo = self.get_states_dataframe()

        df_with_geo = df.merge(df_geo, how='left', left_on='ZipCode5', right_on='zip')
        df_with_geo['state_city'] = df_with_geo['state_name'] + '|' + df_with_geo['city']

        return df_with_geo


    def filter_columns(self, df_with_geo: DataFrame):
        cat_columns = self.cat_columns

        cat_indicator_columns = [name + 'IsMissing' for name in cat_columns]

        zipcodes = [f"ZipCode{n}" for n in [3, 4, 5]]

        valid_columns = ([
             'PersonExactAge',
             'EstimatedHouseholdIncomeCode',
             'EstimatedCurrentHomeValueCode',
             'NumberOfChildren', 'CreditRating', 'NetWorthCode',
             'LengthOfResidenceYears', 'state_name', 'state_city'
        ] + zipcodes + cat_columns + cat_indicator_columns)

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