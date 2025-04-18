import asyncio
import csv
import os
import random
import sys
from decimal import Decimal
from uuid import UUID

from dotenv import load_dotenv
from sqlalchemy import select, cast, String

load_dotenv()


current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from config.database import SessionLocal
from dependencies import get_db
from models.enrichment_models import EnrichmentModels
from models.enrichment_users import EnrichmentUser
from persistence.enrichment_lookalike_scores import EnrichmentLookalikeScoresPersistence
from persistence.enrichment_models import EnrichmentModelsPersistence
from services.similar_audiences.similar_audience_scores import SimilarAudiencesScoresService

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

    db = SessionLocal()
    config = NormalizationConfig(
        numerical_features=[
            'NumberOfChildren', 'LengthOfResidenceYears'
        ],
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
    models = EnrichmentModelsPersistence(db=db)
    scores = SimilarAudiencesScoresService(db=db,
       models=models,
       scores=EnrichmentLookalikeScoresPersistence(db=db),
        normalization=normalizer
   )

    lookalike_id = UUID("8fe7c5e1-6d17-4571-af60-f6e3855dff67")

    dict_enrichment = [v.__dict__ for v in transactions]

    model = service.get_trained_model(dict_enrichment, config)
    features = service.feature_importance(model)

    print("trained model")
    print(features)


    models.save(lookalike_id=lookalike_id, model=model)

    query = db.query(
        EnrichmentUser.id,
        EnrichmentUser.age.label("age"),
        EnrichmentUser.gender.label("PersonGender"),
        EnrichmentUser.estimated_household_income_code.label("EstimatedHouseholdIncomeCode"),
        EnrichmentUser.estimated_current_home_value_code.label("EstimatedCurrentHomeValueCode"),
        EnrichmentUser.homeowner_status.label("HomeownerStatus"),
        EnrichmentUser.has_children.label("HasChildren"),
        EnrichmentUser.number_of_children.label("NumberOfChildren"),
        EnrichmentUser.credit_rating.label("CreditRating"),
        EnrichmentUser.net_worth_code.label("NetWorthCode"),
        cast(EnrichmentUser.zip_code5, String).label("ZipCode5"),
        EnrichmentUser.lat.label("Latitude"),
        EnrichmentUser.lon.label("Longitude"),
        EnrichmentUser.has_credit_card.label("HasCreditCard"),
        EnrichmentUser.length_of_residence_years.label("LengthOfResidenceYears"),
        EnrichmentUser.marital_status.label("MaritalStatus"),
        EnrichmentUser.occupation_group_code.label("OccupationGroupCode"),
        EnrichmentUser.is_book_reader.label("IsBookReader"),
        EnrichmentUser.is_online_purchaser.label("IsOnlinePurchaser"),
        EnrichmentUser.state_abbr.label("StateAbbr"),
        EnrichmentUser.is_traveler.label("IsTraveler"),
    ).select_from(EnrichmentUser)

    scores.calculate_scores(lookalike_id, query, user_id_key='id', config=config)

    print()
    print("done!")







if __name__ == "__main__":
    asyncio.run(main())