import logging
import os
import sys
import asyncio
import functools
import json
from sqlalchemy import desc, cast, String
import statistics
import aioboto3
from aio_pika import IncomingMessage
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv



current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from decimal import Decimal
from schemas.similar_audiences import NormalizationConfig, AudienceData
from services.similar_audiences.audience_data_normalization import AudienceDataNormalizationService, \
    map_letter_to_number, map_credit_rating, map_net_worth_code
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from models.enrichment_lookalike_scores import EnrichmentLookalikeScore
from services.similar_audiences.similar_audience_scores import SimilarAudiencesScoresService
from services.similar_audiences.audience_data_normalization import AudienceDataNormalizationService
from services.similar_audiences import SimilarAudienceService
from models.audience_sources import AudienceSource
from models.audience_lookalikes_persons import AudienceLookalikes
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from persistence.enrichment_lookalike_scores import EnrichmentLookalikeScoresPersistence
from persistence.enrichment_models import EnrichmentModelsPersistence
from typing import Dict, List, Tuple, Any
from decimal import Decimal
from datetime import datetime
from sqlalchemy import create_engine, cast, String
from sqlalchemy.orm import Session
from models.enrichment_user_ids import EnrichmentUserId
from models.enrichment_personal_profiles import EnrichmentPersonalProfiles
from models.enrichment_financial_records import EnrichmentFinancialRecord
from models.enrichment_lifestyles import EnrichmentLifestyle
from models.enrichment_voter_record import EnrichmentVoterRecord



load_dotenv()

AUDIENCE_LOOKALIKES_MATCHING = 'audience_lookalikes_matching'
AUDIENCE_LOOKALIKES_READER = 'audience_lookalikes_reader'
SLEEP_INTERVAL = 60 * 10
SELECTED_ROW_COUNT = 500
AUDIENCE_LOOKALIKES_PROGRESS = "AUDIENCE_LOOKALIKES_PROGRESS"

def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
async def send_sse(connection, user_id: int, data: dict):
    try:
        logging.info(f"send client throught SSE: {data, user_id}")
        await publish_rabbitmq_message(
                    connection=connection,
                    queue_name=f'sse_events_{str(user_id)}',
                    message_body={
                        "status": AUDIENCE_LOOKALIKES_PROGRESS,
                        "data": data
                    }
                )
    except Exception as e:
        logging.error(f"Error sending SSE: {e}")

def get_max_size(lookalike_size):
    if lookalike_size == 'almost_identical':
        size = 10000
    elif lookalike_size == 'extremely_similar':
        size = 50000
    elif lookalike_size == 'very_similar':
        size = 100000
    elif lookalike_size == 'quite_similar':
        size = 200000
    elif lookalike_size == 'broad':
        size = 500000
        
    return size

def get_enrichment_user_column_map() -> Dict[str, Any]:
    return {
        # — Personal Profiles —
        "Age": EnrichmentPersonalProfiles.age.label("Age"),
        "Gender": EnrichmentPersonalProfiles.gender.label("Gender"),
        "HomeownerStatus": EnrichmentPersonalProfiles.homeowner.label("HomeownerStatus"),
        "LengthOfResidenceYears": EnrichmentPersonalProfiles.length_of_residence_years.label("LengthOfResidenceYears"),
        "MaritalStatus": EnrichmentPersonalProfiles.marital_status.label("MaritalStatus"),
        "BusinessOwner": EnrichmentPersonalProfiles.business_owner.label("BusinessOwner"),
        "BirthDay": EnrichmentPersonalProfiles.birth_day.label("BirthDay"),
        "BirthMonth": EnrichmentPersonalProfiles.birth_month.label("BirthMonth"),
        "BirthYear": EnrichmentPersonalProfiles.birth_year.label("BirthYear"),
        "HasChildren": EnrichmentPersonalProfiles.has_children.label("HasChildren"),
        "NumberOfChildren": EnrichmentPersonalProfiles.number_of_children.label("NumberOfChildren"),
        "Religion": EnrichmentPersonalProfiles.religion.label("Religion"),
        "Ethnicity": EnrichmentPersonalProfiles.ethnicity.label("Ethnicity"),
        "LanguageCode": EnrichmentPersonalProfiles.language_code.label("LanguageCode"),
        "StateAbbr": EnrichmentPersonalProfiles.state_abbr.label("StateAbbr"),
        "ZipCode5": cast(EnrichmentPersonalProfiles.zip_code5, String).label("ZipCode5"),

        # — Financial Records —
        "IncomeRange": EnrichmentFinancialRecord.income_range.label("IncomeRange"),
        "NetWorth": EnrichmentFinancialRecord.net_worth.label("NetWorth"),
        "CreditRating": EnrichmentFinancialRecord.credit_rating.label("CreditRating"),
        "CreditCards": EnrichmentFinancialRecord.credit_cards.label("CreditCards"),
        "BankCard": EnrichmentFinancialRecord.bank_card.label("BankCard"),
        "CreditCardPremium": EnrichmentFinancialRecord.credit_card_premium.label("CreditCardPremium"),
        "CreditCardNewIssue": EnrichmentFinancialRecord.credit_card_new_issue.label("CreditCardNewIssue"),
        "CreditLines": EnrichmentFinancialRecord.credit_lines.label("CreditLines"),
        "CreditRangeOfNewCreditLines": EnrichmentFinancialRecord.credit_range_of_new_credit_lines.label("CreditRangeOfNewCreditLines"),
        "Donor": EnrichmentFinancialRecord.donor.label("Donor"),
        "Investor": EnrichmentFinancialRecord.investor.label("Investor"),
        "MailOrderDonor": EnrichmentFinancialRecord.mail_order_donor.label("MailOrderDonor"),

        # — Lifestyle —
        "Pets": EnrichmentLifestyle.pets.label("Pets"),
        "CookingEnthusiast": EnrichmentLifestyle.cooking_enthusiast.label("CookingEnthusiast"),
        "Travel": EnrichmentLifestyle.travel.label("Travel"),
        "MailOrderBuyer": EnrichmentLifestyle.mail_order_buyer.label("MailOrderBuyer"),
        "OnlinePurchaser": EnrichmentLifestyle.online_purchaser.label("OnlinePurchaser"),
        "BookReader": EnrichmentLifestyle.book_reader.label("BookReader"),
        "HealthAndBeauty": EnrichmentLifestyle.health_and_beauty.label("HealthAndBeauty"),
        "Fitness": EnrichmentLifestyle.fitness.label("Fitness"),
        "OutdoorEnthusiast": EnrichmentLifestyle.outdoor_enthusiast.label("OutdoorEnthusiast"),
        "TechEnthusiast": EnrichmentLifestyle.tech_enthusiast.label("TechEnthusiast"),
        "Diy": EnrichmentLifestyle.diy.label("Diy"),
        "Gardening": EnrichmentLifestyle.gardening.label("Gardening"),
        "AutomotiveBuff": EnrichmentLifestyle.automotive_buff.label("AutomotiveBuff"),
        "GolfEnthusiasts": EnrichmentLifestyle.golf_enthusiasts.label("GolfEnthusiasts"),
        "BeautyCosmetics": EnrichmentLifestyle.beauty_cosmetics.label("BeautyCosmetics"),
        "Smoker": EnrichmentLifestyle.smoker.label("Smoker"),

        # — Voter Record —
        "PartyAffiliation": EnrichmentVoterRecord.party_affiliation.label("PartyAffiliation"),
        "CongressionalDistrict": EnrichmentVoterRecord.congressional_district.label("CongressionalDistrict"),
        "VotingPropensity": EnrichmentVoterRecord.voting_propensity.label("VotingPropensity"),
    }

def build_dynamic_query_and_config(
    db_session: Session,
    sig: Dict[str, float]
) -> Tuple:
    column_map = get_enrichment_user_column_map()
    dynamic_columns = [column_map[name] for name in sig if name in column_map]
    select_columns = [
        EnrichmentUserId.id.label("EnrichmentUserId"),
        *dynamic_columns
    ]

    query = (
        db_session
        .query(*select_columns)
        .select_from(EnrichmentUserId)
        .outerjoin(
            EnrichmentPersonalProfiles,
            EnrichmentPersonalProfiles.asid == EnrichmentUserId.asid
        )
        .outerjoin(
            EnrichmentFinancialRecord,
            EnrichmentFinancialRecord.asid == EnrichmentUserId.asid
        )
        .outerjoin(
            EnrichmentLifestyle,
            EnrichmentLifestyle.asid == EnrichmentUserId.asid
        )
        .outerjoin(
            EnrichmentVoterRecord,
            EnrichmentVoterRecord.asid == EnrichmentUserId.asid
        )
    )

    numerical = {"NumberOfChildren", "LengthOfResidenceYears"}
    unordered = {
        "IsOnlinePurchaser", "IsTraveler", "PersonGender",
        "HasChildren", "HomeownerStatus", "MaritalStatus",
        "HasCreditCard"
    }
    ordered = {
        "EstimatedHouseholdIncomeCode": map_letter_to_number,
        "EstimatedCurrentHomeValueCode": map_letter_to_number,
        "CreditRating": map_credit_rating,
        "NetWorthCode": map_net_worth_code,
    }
    config = NormalizationConfig(
        numerical_features=[name for name in sig if name in numerical],
        unordered_features=[name for name in sig if name in unordered],
        ordered_features={name: ordered[name] for name in sig if name in ordered},
    )
    return query, config


def fetch_user_profiles(
    db_session: Session,
    audience_lookalike: AudienceLookalikes
) -> List[AudienceData]:
    sig_fields = audience_lookalike.significant_fields or {}
        
    column_map = {
        "EmailAddress": AudienceSourcesMatchedPerson.email.label("EmailAddress"),
        "customer_value": (AudienceSourcesMatchedPerson.value_score.label("customer_value")),
        **get_enrichment_user_column_map()
    }
    select_cols = [column_map["EmailAddress"]]
    for fld in sig_fields:
        if fld in column_map:
            select_cols.append(column_map[fld])
    select_cols.append(column_map["customer_value"])

    rows = (
        db_session.query(*select_cols)
        .select_from(AudienceSource)
        .join(
            AudienceSourcesMatchedPerson,
            AudienceSourcesMatchedPerson.source_id == AudienceSource.id
        )
        .join(
            EnrichmentUserId,
            EnrichmentUserId.id == AudienceSourcesMatchedPerson.enrichment_user_id
        )
        .outerjoin(
            EnrichmentPersonalProfiles,
            EnrichmentPersonalProfiles.asid == EnrichmentUserId.asid
        )
        .outerjoin(
            EnrichmentFinancialRecord,
            EnrichmentFinancialRecord.asid == EnrichmentUserId.asid
        )
        .outerjoin(
            EnrichmentLifestyle,
            EnrichmentLifestyle.asid == EnrichmentUserId.asid
        )
        .outerjoin(
            EnrichmentVoterRecord,
            EnrichmentVoterRecord.asid == EnrichmentUserId.asid
        )
        .filter(AudienceSource.id == audience_lookalike.source_uuid)
        .all()
    )
    profiles: List[AudienceData] = []
    for row in rows:
        data_kwargs = {}
        for label, value in row._mapping.items():
            if label == "customer_value":
                data_kwargs[label] = Decimal(str(value))
            else:
                data_kwargs[label] = str(value)

        profiles.append(AudienceData(**data_kwargs))
        
    return profiles


def train_and_save_model(
    lookalike_id: int,
    user_profiles: List[AudienceData],
    config: NormalizationConfig,
    similar_audiences_scores_service: SimilarAudiencesScoresService,
    similar_audience_service: SimilarAudienceService
):
    dict_enrichment = [
        {k: str(v) if v is not None else "None" for k, v in profile.__dict__.items()}
        for profile in user_profiles
    ]
    model = similar_audience_service.get_trained_model(dict_enrichment, config)
    similar_audiences_scores_service.save_enrichment_model(
        lookalike_id=lookalike_id,
        model=model
    )
    return model


def calculate_and_store_scores(
    model,
    lookalike_id: int,
    query,
    similar_audiences_scores_service: SimilarAudiencesScoresService,
    config
):
    similar_audiences_scores_service.calculate_scores(
        model=model,
        lookalike_id=lookalike_id,
        query=query,
        user_id_key="EnrichmentUserId",
        config=config
    )

def process_lookalike_pipeline(
    db_session: Session,
    audience_lookalike: AudienceLookalikes,
    similar_audiences_scores_service: SimilarAudiencesScoresService,
    similar_audience_service: SimilarAudienceService
):
    sig = audience_lookalike.significant_fields or {}
    query, config = build_dynamic_query_and_config(db_session, sig)
    profiles = fetch_user_profiles(db_session, audience_lookalike)
    model = train_and_save_model(
        lookalike_id=audience_lookalike.id,
        user_profiles=profiles,
        config=config,
        similar_audiences_scores_service=similar_audiences_scores_service,
        similar_audience_service=similar_audience_service
    )

    calculate_and_store_scores(
        model=model,
        lookalike_id=audience_lookalike.id,
        query=query,
        similar_audiences_scores_service=similar_audiences_scores_service,
        config=config
    )

async def aud_sources_reader(message: IncomingMessage, db_session: Session, connection, similar_audiences_scores_service: SimilarAudiencesScoresService, similar_audience_service: SimilarAudienceService):
    try:
        message_body = json.loads(message.body)
        lookalike_id = message_body.get('lookalike_id')
        
        audience_lookalike = db_session.query(AudienceLookalikes).filter(AudienceLookalikes.id == lookalike_id).first()
        if not audience_lookalike:
            logging.info(f"audience_lookalike with id {lookalike_id} not found")
            await message.ack()
            return
        
        total_rows = get_max_size(audience_lookalike.lookalike_size)
        process_lookalike_pipeline(db_session=db_session, audience_lookalike=audience_lookalike, similar_audiences_scores_service=similar_audiences_scores_service, similar_audience_service=similar_audience_service)
        
        enrichment_lookalike_scores = (
            db_session.query(EnrichmentLookalikeScore.score, EnrichmentLookalikeScore.enrichment_user_id)
            .filter(EnrichmentLookalikeScore.lookalike_id == lookalike_id)
            .order_by(desc(EnrichmentLookalikeScore.score))
            .limit(total_rows)
            .all()
        )
        logging.info(f"Total row in pixel file: {len(enrichment_lookalike_scores)}")
        audience_lookalike.size = len(enrichment_lookalike_scores)
        scores = [float(s.score) for s in enrichment_lookalike_scores if s.score is not None]
        if scores:
            similarity_score = {
                "min": round(min(scores), 3),
                "max": round(max(scores), 3),
                "average": round(sum(scores) / len(scores), 3),
                "median": round(statistics.median(scores), 3),
            }
        else:
            similarity_score = {
                "min": None,
                "max": None,
                "average": None,
                "median": None,
            }
        audience_lookalike.similarity_score = similarity_score
        db_session.add(audience_lookalike)
        db_session.flush()
        await send_sse(connection, audience_lookalike.user_id, {"lookalike_id": str(audience_lookalike.id), "total": total_rows, "processed": 0})
        
        if not enrichment_lookalike_scores:
            await message.ack()
            return
            
        persons = [str(enrichment_lookalike_score.enrichment_user_id) for enrichment_lookalike_score in enrichment_lookalike_scores]
        
        message_body = {
            'lookalike_id': str(audience_lookalike.id),
            'user_id': audience_lookalike.user_id,
            'enrichment_user': persons
        }
    
        await publish_rabbitmq_message(connection=connection, queue_name=AUDIENCE_LOOKALIKES_MATCHING, message_body=message_body)

        db_session.commit()
        await message.ack()
    except BaseException as e:
        db_session.rollback()
        logging.error(f"Error processing message: {e}", exc_info=True)
        await message.reject(requeue=True)


async def main():
    log_level = logging.INFO
    if len(sys.argv) > 1:
        arg = sys.argv[1].upper()
        if arg == 'DEBUG':
            log_level = logging.DEBUG
        elif arg != 'INFO':
            sys.exit("Invalid log level argument. Use 'DEBUG' or 'INFO'.")
    
    setup_logging(log_level)
    db_username = os.getenv('DB_USERNAME')
    db_password = os.getenv('DB_PASSWORD')
    db_host = os.getenv('DB_HOST')
    db_name = os.getenv('DB_NAME')

    try:
        rmq_connection = RabbitMQConnection()
        connection = await rmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)

        engine = create_engine(
            f"postgresql://{db_username}:{db_password}@{db_host}/{db_name}", pool_pre_ping=True
        )
        Session = sessionmaker(bind=engine)
        db_session = Session()
        audience_data_normalization_service = AudienceDataNormalizationService()
        
        similar_audience_service = SimilarAudienceService(audience_data_normalization_service=audience_data_normalization_service)
        similar_audiences_scores_service = SimilarAudiencesScoresService(normalization_service=audience_data_normalization_service, db=db_session, enrichment_models_persistence = EnrichmentModelsPersistence(db=db_session), enrichment_lookalike_scores_persistence = EnrichmentLookalikeScoresPersistence(db=db_session))
        reader_queue = await channel.declare_queue(
            name=AUDIENCE_LOOKALIKES_READER,
            durable=True,
        )
        await reader_queue.consume(functools.partial(aud_sources_reader, db_session=db_session, connection=connection, similar_audience_service=similar_audience_service, similar_audiences_scores_service=similar_audiences_scores_service))

        await asyncio.Future()

    except BaseException:
        db_session.rollback()
        logging.error('Unhandled Exception:', exc_info=True)

    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        if rmq_connection:
            logging.info("Closing RabbitMQ connection...")
            await rmq_connection.close()
        logging.info("Shutting down...")
        

if __name__ == "__main__":
    asyncio.run(main())