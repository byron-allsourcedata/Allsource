import asyncio
import csv
import random
from decimal import Decimal

from backend.services.similar_audiences.audience_data_normalization import AudienceDataNormalizationService

from ..schemas.similar_audiences import AudienceData
from ..services.similar_audiences import SimilarAudienceService


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
    transactions = read_csv_transactions('backend/data/enrichment.csv')
    normalizer = AudienceDataNormalizationService()
    service = SimilarAudienceService(normalizer=normalizer)
    scores = service.get_audience_feature_importance(transactions)

    print(scores)


if __name__ == "__main__":
    asyncio.run(main())