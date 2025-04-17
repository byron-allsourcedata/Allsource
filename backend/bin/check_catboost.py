import asyncio
import csv
import os
import random
import sys
from decimal import Decimal
from dotenv import load_dotenv


load_dotenv()


current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from config.folders import Folders

from services.similar_audiences.audience_data_normalization import AudienceDataNormalizationService, \
    map_letter_to_number, map_credit_rating, map_net_worth_code

from schemas.similar_audiences import AudienceData, NormalizationConfig
from services.similar_audiences import SimilarAudienceService
from services.similar_audiences.audience_data_normalization import AudienceDataNormalizationService


def read_csv_transactions(file_path: str):
    user_profiles = []

    with open(file_path, mode='r', newline='') as file:
        reader = csv.DictReader(file)
        for row in reader:
            children = 0 if row['NumberOfChildren'] == '' else int(row['NumberOfChildren'])
            # in real code provide amount calculated from transactions
            amount = children * random.randint(0, 5) * 50 + 100
            user_profiles.append(AudienceData(**row, customer_value=Decimal(amount)))

    return user_profiles

async def main():
    config =  NormalizationConfig(
        numerical_features=['PersonExactAge', 'NumberOfChildren', 'LengthOfResidenceYears'],
        unordered_features=[
            'PersonGender', 'HasChildren', 'HomeownerStatus', 'MaritalStatus'
        ],
        ordered_features={
            'EstimatedHouseholdIncomeCode': map_letter_to_number,
            'EstimatedCurrentHomeValueCode': map_letter_to_number,
            'CreditRating': map_credit_rating,
            'NetWorthCode': map_net_worth_code
        }
    )

    transactions = read_csv_transactions(Folders.data('enrichment.csv'))
    normalizer = AudienceDataNormalizationService()
    service = SimilarAudienceService(normalizer=normalizer)

    dict_enrichment = [v.__dict__ for v in transactions]
    scores = service.get_audience_feature_importance_with_config(dict_enrichment, config)

    print(scores)


if __name__ == "__main__":
    asyncio.run(main())