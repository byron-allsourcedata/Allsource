import logging
import os
import sys
import asyncio
import functools
import json
from collections import Counter

from sqlalchemy import desc, cast, String
import statistics
import aioboto3
from aio_pika import IncomingMessage
from sqlalchemy.orm import sessionmaker, Session, aliased
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from decimal import Decimal
from schemas.similar_audiences import NormalizationConfig, AudienceData
from services.similar_audiences.audience_data_normalization import AudienceDataNormalizationService, \
    map_letter_to_number, map_credit_rating, map_net_worth_code
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from services.similar_audiences.similar_audience_scores import SimilarAudiencesScoresService
from services.similar_audiences.audience_data_normalization import AudienceDataNormalizationService
from services.similar_audiences import SimilarAudienceService
from models.audience_sources import AudienceSource
from models.audience_lookalikes_persons import AudienceLookalikes
from models import EnrichmentEmploymentHistory, EnrichmentProfessionalProfile
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from persistence.enrichment_lookalike_scores import EnrichmentLookalikeScoresPersistence
from persistence.enrichment_models import EnrichmentModelsPersistence
from typing import Dict, List, Tuple, Any
from decimal import Decimal
from datetime import datetime
from sqlalchemy import create_engine, cast, String
from sqlalchemy.orm import Session
from models.enrichment import EnrichmentUser, EnrichmentPersonalProfiles, EnrichmentFinancialRecord, EnrichmentLifestyle, EnrichmentVoterRecord, EnrichmentLookalikeScore



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
        "age": EnrichmentPersonalProfiles.age.label("age"),
        "gender": EnrichmentPersonalProfiles.gender.label("gender"),
        "homeowner": EnrichmentPersonalProfiles.homeowner.label("homeowner"),
        "length_of_residence_years": EnrichmentPersonalProfiles.length_of_residence_years.label("length_of_residence_years"),
        "marital_status": EnrichmentPersonalProfiles.marital_status.label("marital_status"),
        "business_owner": EnrichmentPersonalProfiles.business_owner.label("business_owner"),
        "birth_day": EnrichmentPersonalProfiles.birth_day.label("birth_day"),
        "birth_month": EnrichmentPersonalProfiles.birth_month.label("birth_month"),
        "birth_year": EnrichmentPersonalProfiles.birth_year.label("birth_year"),
        "has_children": EnrichmentPersonalProfiles.has_children.label("has_children"),
        "number_of_children": EnrichmentPersonalProfiles.number_of_children.label("number_of_children"),
        "religion": EnrichmentPersonalProfiles.religion.label("religion"),
        "ethnicity": EnrichmentPersonalProfiles.ethnicity.label("ethnicity"),
        "language_code": EnrichmentPersonalProfiles.language_code.label("language_code"),
        "state_abbr": EnrichmentPersonalProfiles.state_abbr.label("state_abbr"),
        "state": EnrichmentPersonalProfiles.state_abbr.label("state"),
        "zip_code5": cast(EnrichmentPersonalProfiles.zip_code5, String).label("zip_code5"),

        # — Financial Records —
        "income_range": EnrichmentFinancialRecord.income_range.label("income_range"),
        "net_worth": EnrichmentFinancialRecord.net_worth.label("net_worth"),
        "credit_rating": EnrichmentFinancialRecord.credit_rating.label("credit_rating"),
        "credit_cards": EnrichmentFinancialRecord.credit_cards.label("credit_cards"),
        "bank_card": EnrichmentFinancialRecord.bank_card.label("bank_card"),
        "credit_card_premium": EnrichmentFinancialRecord.credit_card_premium.label("credit_card_premium"),
        "credit_card_new_issue": EnrichmentFinancialRecord.credit_card_new_issue.label("credit_card_new_issue"),
        "credit_lines": EnrichmentFinancialRecord.credit_lines.label("credit_lines"),
        "credit_range_of_new_credit_lines": EnrichmentFinancialRecord.credit_range_of_new_credit_lines.label("credit_range_of_new_credit_lines"),
        "donor": EnrichmentFinancialRecord.donor.label("donor"),
        "investor": EnrichmentFinancialRecord.investor.label("investor"),
        "mail_order_donor": EnrichmentFinancialRecord.mail_order_donor.label("mail_order_donor"),

        # — Lifestyle —
        "pets": EnrichmentLifestyle.pets.label("pets"),
        "cooking_enthusiast": EnrichmentLifestyle.cooking_enthusiast.label("cooking_enthusiast"),
        "travel": EnrichmentLifestyle.travel.label("travel"),
        "mail_order_buyer": EnrichmentLifestyle.mail_order_buyer.label("mail_order_buyer"),
        "online_purchaser": EnrichmentLifestyle.online_purchaser.label("online_purchaser"),
        "book_reader": EnrichmentLifestyle.book_reader.label("book_reader"),
        "health_and_beauty": EnrichmentLifestyle.health_and_beauty.label("health_and_beauty"),
        "fitness": EnrichmentLifestyle.fitness.label("fitness"),
        "outdoor_enthusiast": EnrichmentLifestyle.outdoor_enthusiast.label("outdoor_enthusiast"),
        "tech_enthusiast": EnrichmentLifestyle.tech_enthusiast.label("tech_enthusiast"),
        "diy": EnrichmentLifestyle.diy.label("diy"),
        "gardening": EnrichmentLifestyle.gardening.label("gardening"),
        "automotive_buff": EnrichmentLifestyle.automotive_buff.label("automotive_buff"),
        "golf_enthusiasts": EnrichmentLifestyle.golf_enthusiasts.label("golf_enthusiasts"),
        "beauty_cosmetics": EnrichmentLifestyle.beauty_cosmetics.label("beauty_cosmetics"),
        "smoker": EnrichmentLifestyle.smoker.label("smoker"),

        # — Voter Record —
        "party_affiliation": EnrichmentVoterRecord.party_affiliation.label("party_affiliation"),
        "congressional_district": EnrichmentVoterRecord.congressional_district.label("congressional_district"),
        "voting_propensity": EnrichmentVoterRecord.voting_propensity.label("voting_propensity"),

        # — Employment History —
        "job_title": EnrichmentEmploymentHistory.job_title.label("job_title"),
        "company_name": EnrichmentEmploymentHistory.company_name.label("company_name"),
        "start_date": EnrichmentEmploymentHistory.start_date.label("start_date"),
        "end_date": EnrichmentEmploymentHistory.end_date.label("end_date"),
        "is_current": EnrichmentEmploymentHistory.is_current.label("is_current"),
        "location": EnrichmentEmploymentHistory.location.label("location"),
        "job_description": EnrichmentEmploymentHistory.job_description.label("job_description"),

        # — Professional Profile —
        "current_job_title": EnrichmentProfessionalProfile.current_job_title.label("current_job_title"),
        "current_company_name": EnrichmentProfessionalProfile.current_company_name.label("current_company_name"),
        "job_start_date": EnrichmentProfessionalProfile.job_start_date.label("job_start_date"),
        "job_duration": EnrichmentProfessionalProfile.job_duration.label("job_duration"),
        "job_location": EnrichmentProfessionalProfile.job_location.label("job_location"),
        "job_level": EnrichmentProfessionalProfile.job_level.label("job_level"),
        "department": EnrichmentProfessionalProfile.department.label("department"),
        "company_size": EnrichmentProfessionalProfile.company_size.label("company_size"),
        "primary_industry": EnrichmentProfessionalProfile.primary_industry.label("primary_industry"),
        "annual_sales": EnrichmentProfessionalProfile.annual_sales.label("annual_sales"),
    }

def build_dynamic_query_and_config(
    db_session: Session,
    sig: Dict[str, float]
) -> Tuple:
    column_map = get_enrichment_user_column_map()
    for key in ['job_title', 'company_name', 'start_date', 'end_date', 'is_current', 'location', 'job_description',
                'party_affiliation', 'congressional_district', 'voting_propensity']:
        column_map.pop(key, None)
    employment_subq = (
        db_session
        .query(
            EnrichmentEmploymentHistory.asid.label('asid'),
            EnrichmentEmploymentHistory.job_title.label('job_title'),
            EnrichmentEmploymentHistory.company_name.label('company_name'),
            EnrichmentEmploymentHistory.start_date.label('start_date'),
            EnrichmentEmploymentHistory.end_date.label('end_date'),
            EnrichmentEmploymentHistory.is_current.label('is_current'),
            EnrichmentEmploymentHistory.location.label('location'),
            EnrichmentEmploymentHistory.job_description.label('job_description')
        )
        .filter(EnrichmentEmploymentHistory.is_current == True)
        .distinct(EnrichmentEmploymentHistory.asid)
        .subquery('emp_curr')
    )
    voter_subq = (
        db_session
        .query(
            EnrichmentVoterRecord.asid.label('asid'),
            EnrichmentVoterRecord.party_affiliation.label('party_affiliation'),
            EnrichmentVoterRecord.congressional_district.label('congressional_district'),
            EnrichmentVoterRecord.voting_propensity.label('voting_propensity')
        )
        .distinct(EnrichmentVoterRecord.asid)
        .subquery('voter_curr')
    )

    column_map.update({
        'job_title': employment_subq.c.job_title,
        'company_name': employment_subq.c.company_name,
        'start_date': employment_subq.c.start_date,
        'end_date': employment_subq.c.end_date,
        'is_current': employment_subq.c.is_current,
        'location': employment_subq.c.location,
        'job_description': employment_subq.c.job_description,
        'party_affiliation': voter_subq.c.party_affiliation,
        'congressional_district': voter_subq.c.congressional_district,
        'voting_propensity': voter_subq.c.voting_propensity,
    })

    selected_fields = [name for name in sig.keys() if name in column_map]
    dynamic_columns = [column_map[name] for name in selected_fields]
    select_columns = [
        EnrichmentUser.id.label("EnrichmentUser"),
        *dynamic_columns
    ]
    unordered = [f for f in selected_fields if f != "zip_code5"]

    query = (
        db_session
        .query(*select_columns)
        .select_from(EnrichmentUser)
        .outerjoin(
            EnrichmentPersonalProfiles,
            EnrichmentPersonalProfiles.asid == EnrichmentUser.asid
        )
        .outerjoin(
            EnrichmentFinancialRecord,
            EnrichmentFinancialRecord.asid == EnrichmentUser.asid
        )
        .outerjoin(
            EnrichmentLifestyle,
            EnrichmentLifestyle.asid == EnrichmentUser.asid
        )
        .outerjoin(
            EnrichmentProfessionalProfile,
            EnrichmentProfessionalProfile.asid == EnrichmentUser.asid
        )
        .outerjoin(
            employment_subq,
            employment_subq.c.asid == EnrichmentUser.asid
        )
        .outerjoin(
            voter_subq,
            voter_subq.c.asid == EnrichmentUser.asid
        )
    )

    normalization_config = NormalizationConfig(
        numerical_features=[],
        ordered_features={},
        unordered_features=unordered
    )

    return query, normalization_config


def fetch_user_profiles(
    db_session: Session,
    audience_lookalike: AudienceLookalikes
) -> List[Dict]:
    sig_fields = audience_lookalike.significant_fields or {}
        
    column_map = {
        "customer_value": (AudienceSourcesMatchedPerson.value_score.label("customer_value")),
        **get_enrichment_user_column_map()
    }
    select_cols = []
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
            EnrichmentUser,
            EnrichmentUser.id == AudienceSourcesMatchedPerson.enrichment_user_id
        )
        .outerjoin(
            EnrichmentPersonalProfiles,
            EnrichmentPersonalProfiles.asid == EnrichmentUser.asid
        )
        .outerjoin(
            EnrichmentFinancialRecord,
            EnrichmentFinancialRecord.asid == EnrichmentUser.asid
        )
        .outerjoin(
            EnrichmentLifestyle,
            EnrichmentLifestyle.asid == EnrichmentUser.asid
        )
        .outerjoin(
            EnrichmentVoterRecord,
            EnrichmentVoterRecord.asid == EnrichmentUser.asid
        )
        .outerjoin(
            EnrichmentEmploymentHistory,
            EnrichmentEmploymentHistory.asid == EnrichmentUser.asid
        )
        .outerjoin(
            EnrichmentProfessionalProfile,
            EnrichmentProfessionalProfile.asid == EnrichmentUser.asid
        )
        .filter(AudienceSource.id == audience_lookalike.source_uuid)
        .all()
    )
    profiles: List[Dict] = []
    for row in rows:
        data_kwargs = {}
        for label, value in row._mapping.items():
            if label == "customer_value":
                data_kwargs[label] = Decimal(str(value))
            else:
                data_kwargs[label] = str(value)

        profiles.append(data_kwargs)
        
    return profiles


def train_and_save_model(
    lookalike_id: int,
    user_profiles: List[Dict],
    config: NormalizationConfig,
    similar_audiences_scores_service: SimilarAudiencesScoresService,
    similar_audience_service: SimilarAudienceService
):
    dict_enrichment = [
        {k: str(v) if v is not None else "None" for k, v in profile.items()}
        for profile in user_profiles
    ]
    trained = similar_audience_service.get_trained_model(dict_enrichment, config)
    model = trained[0] if isinstance(trained, (tuple, list)) else trained
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
        user_id_key="EnrichmentUser",
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
            arguments={
                'x-consumer-timeout': 14400000,
            }
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