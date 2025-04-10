import string
from typing import List, Annotated

import pandas as pd
from pandas import DataFrame
from backend.schemas.similar_audiences import AudienceData
from fastapi import Depends

letter_to_number = {
    ch: (None if ch == 'U' else i + 1)
    for i, ch in enumerate(string.ascii_uppercase)
}

letter_to_number_E = {
    ch: (None if ch == 'U' else i + 1)
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
    def map_letter_category(self):
        return letter_to_number

    def normalize(self, audience_data: List[AudienceData]) -> DataFrame:
        df = pd.DataFrame([t.__dict__ for t in audience_data])

        int_columns = ['PersonExactAge','NumberOfChildren', 'LengthOfResidenceYears']
        cat_columns = [
            'PersonGender', 'HasChildren','HomeownerStatus', 'MaritalStatus',
            'HasCreditCard', 'OccupationGroupCode', 'IsBookReader',
            'IsOnlinePurchaser', 'IsTraveler'
        ]

        for name in int_columns:
            df[name] = df[name].map(convert_to_int).astype('Int64')

        for name in cat_columns:
            df[name] = df[name].astype('category')

        df['EstimatedHouseholdIncomeCode'] = df['EstimatedHouseholdIncomeCode'].map(letter_to_number).astype('Int64')
        df['EstimatedCurrentHomeValueCode'] = df['EstimatedCurrentHomeValueCode'].map(letter_to_number).astype('Int64')
        df['CreditRating'] = df['CreditRating'].map(letter_to_number_E).astype('Int64')
        df['NetWorthCode'] = df['NetWorthCode'].map(letter_to_number_I).astype('Int64')


        return df


def get_audience_data_normalization_service():
    return AudienceDataNormalizationService()

AudienceDataNormalizationServiceDep = Annotated[AudienceDataNormalizationService, Depends(get_audience_data_normalization_service)]