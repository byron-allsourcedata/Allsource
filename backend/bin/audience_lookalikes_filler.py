import logging
import os
import sys
import asyncio
import functools
import json
from decimal import Decimal
from pathlib import Path
from typing import List

import chardet
import io
import csv
import boto3
import aioboto3
from aio_pika import IncomingMessage
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
from itertools import islice

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from ..schemas.similar_audiences import AudienceData
from ..services.similar_audiences.audience_data_normalization import AudienceDataNormalizationService
from ..models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from ..services.similar_audiences import SimilarAudienceService
from ..models.enrichment_users import EnrichmentUser
from sqlalchemy import func, create_engine
from ..models.audience_lookalikes_persons import AudienceLookalikes
import random
from ..config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

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

def get_max_ids(lookalike_size):
    if lookalike_size == 'almost_identical':
        max = 250000
    if lookalike_size == 'extremely_similar':
        max = 200000
    if lookalike_size == 'very_similar':
        max = 150000
    if lookalike_size == 'broad':
        max = 100000
    else:
        max = 250000
        
    num_users = random.randint(10000, max)
    return num_users


def get_number_users(lookalike_size, size):
    if lookalike_size == 'almost_identical':
        number = size * 0.2
    elif lookalike_size == 's':
        number = size * 0.4
    elif lookalike_size == 'very_similar':
        number = size * 0.6
    elif lookalike_size == 'broad':
        number = size * 1
    else:
        number = size * 0.8

    return number


async def aud_sources_reader(message: IncomingMessage, db_session: Session, connection, similar_audience_service: SimilarAudienceService):
    try:
        message_body = json.loads(message.body)
        lookalike_id = message_body.get('lookalike_id')
        
        audience_lookalike = db_session.query(AudienceLookalikes).filter(AudienceLookalikes.id == lookalike_id).first()
        if not audience_lookalike:
            logging.info(f"audience_lookalike with id {lookalike_id} not found")
            await message.ack()
            return
        
        total_rows = get_max_ids(audience_lookalike.lookalike_size)
        processed_rows = 0

        results = db_session.query(EnrichmentUser.id).limit(total_rows).all()
        
        logging.info(f"Total row in pixel file: {total_rows}")
        audience_lookalike.size = len(results)
        db_session.add(audience_lookalike)
        db_session.flush()
        await send_sse(connection, audience_lookalike.user_id, {"lookalike_id": str(audience_lookalike.id), "total": total_rows, "processed": processed_rows})
        
        if not results:
            await message.ack()
            return
            
        persons = [str(row[0]) for row in results]
        
        message_body = {
            'lookalike_id': str(audience_lookalike.id),
            'user_id': audience_lookalike.user_id,
            'enrichment_user': persons
        }
    
        await publish_rabbitmq_message(connection=connection, queue_name=AUDIENCE_LOOKALIKES_MATCHING, message_body=message_body)

        join_query = (
            db_session.query(EnrichmentUser, AudienceSourcesMatchedPerson.value_score,
                             AudienceSourcesMatchedPerson.email)
            .select_from(AudienceSourcesMatchedPerson)
            .join(EnrichmentUser, AudienceSourcesMatchedPerson.enrichment_user_id == EnrichmentUser.id)
            .filter(AudienceSourcesMatchedPerson.source_id == audience_lookalike.source_uuid)
            .order_by(AudienceSourcesMatchedPerson.value_score.desc())
        )
        results = join_query.all()

        all_matched_persons = results
        total_matched = len(all_matched_persons)
        number_required = int(get_number_users(audience_lookalike.lookalike_size, total_matched))
        selected_results = all_matched_persons[:number_required]
        audience_data_list: List[AudienceData] = []

        for enrichment_user, value_score, email in selected_results:
            audience_data = AudienceData(
                EmailAddress=email,
                PersonExactAge=str(enrichment_user.age),
                PersonGender=str(enrichment_user.gender),
                EstimatedHouseholdIncomeCode=str(enrichment_user.estimated_household_income_code),
                EstimatedCurrentHomeValueCode=str(enrichment_user.estimated_current_home_value_code),
                HomeownerStatus=str(enrichment_user.homeowner_status),
                HasChildren=str(enrichment_user.has_children),
                NumberOfChildren=str(enrichment_user.number_of_children),
                CreditRating=str(enrichment_user.credit_rating),
                NetWorthCode=str(enrichment_user.net_worth_code),
                ZipCode5=str(enrichment_user.zip_code5) if enrichment_user.zip_code5 is not None else None,
                Latitude=enrichment_user.lat,
                Longitude=enrichment_user.lon,
                HasCreditCard=str(enrichment_user.has_credit_card),
                LengthOfResidenceYears=str(enrichment_user.length_of_residence_years),
                MaritalStatus=str(enrichment_user.marital_status),
                OccupationGroupCode=enrichment_user.occupation_group_code,
                IsBookReader=str(enrichment_user.is_book_reader),
                IsOnlinePurchaser=str(enrichment_user.is_online_purchaser),
                StateAbbr=enrichment_user.state_abbr,
                IsTraveler=str(enrichment_user.is_traveler),
                customer_value=Decimal(value_score)
            )
            audience_data_list.append(audience_data)

        audience_feature_importance = similar_audience_service.get_audience_feature_importance(audience_data_list)

        audience_feature_dict = audience_feature_importance.__dict__
        for key in audience_feature_dict.keys():
            audience_feature_dict[key] = round(audience_feature_dict[key] * 1000) / 1000
        sorted_dict = dict(sorted(audience_feature_dict.items(), key=lambda item: item[1], reverse=True))
        audience_lookalike.significant_fields = sorted_dict

        db_session.commit()
        await message.ack()
    except BaseException as e:
        db_session.rollback()
        logging.error(f"Error processing message: {e}", exc_info=True)
        await message.ack()


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
        similar_audience_service = SimilarAudienceService(normalizer=similar_audience_data_normalization)
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