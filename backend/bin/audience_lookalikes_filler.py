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
from schemas.similar_audiences import NormalizationConfig
from services.similar_audiences.audience_data_normalization import AudienceDataNormalizationService, \
    map_letter_to_number, map_credit_rating, map_net_worth_code
from models.enrichment_lookalike_scores import EnrichmentLookalikeScore
from services.similar_audiences.similar_audience_scores import SimilarAudiencesScoresService
from services.similar_audiences.audience_data_normalization import AudienceDataNormalizationService
from models.enrichment_users import EnrichmentUser
from sqlalchemy import create_engine
from models.audience_lookalikes_persons import AudienceLookalikes
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from persistence.enrichment_lookalike_scores import EnrichmentLookalikeScoresPersistence
from persistence.enrichment_models import EnrichmentModelsPersistence


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


async def aud_sources_reader(message: IncomingMessage, db_session: Session, connection, similar_audience_service: SimilarAudiencesScoresService):
    try:
        message_body = json.loads(message.body)
        lookalike_id = message_body.get('lookalike_id')
        
        audience_lookalike = db_session.query(AudienceLookalikes).filter(AudienceLookalikes.id == lookalike_id).first()
        if not audience_lookalike:
            logging.info(f"audience_lookalike with id {lookalike_id} not found")
            await message.ack()
            return
        
        total_rows = get_max_size(audience_lookalike.lookalike_size)
        processed_rows = 0
        query = db_session.query(
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

        similar_audience_service.calculate_scores(lookalike_id=lookalike_id, query=query, user_id_key='id', config=config)
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
                "min": round(min(scores), 2),
                "max": round(max(scores), 2),
                "average": round(sum(scores) / len(scores), 2),
                "median": round(statistics.median(scores), 2),
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
        await send_sse(connection, audience_lookalike.user_id, {"lookalike_id": str(audience_lookalike.id), "total": total_rows, "processed": processed_rows})
        
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
        s3_session = aioboto3.Session()
        similar_audience_data_normalization = AudienceDataNormalizationService()
        similar_audience_service = SimilarAudiencesScoresService(normalization=similar_audience_data_normalization, db=db_session, models = EnrichmentModelsPersistence(db=db_session), scores = EnrichmentLookalikeScoresPersistence(db=db_session))
        reader_queue = await channel.declare_queue(
            name=AUDIENCE_LOOKALIKES_READER,
            durable=True,
        )
        await reader_queue.consume(functools.partial(aud_sources_reader, db_session=db_session, connection=connection, similar_audience_service=similar_audience_service))

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