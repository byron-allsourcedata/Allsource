import logging
import os
import sys
import asyncio
import functools
import json
import boto3
import random
import requests
from datetime import datetime
from rapidfuzz import fuzz
from sqlalchemy import update
from aio_pika import IncomingMessage, Message
from sqlalchemy.exc import IntegrityError
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models.audience_smarts import AudienceSmart
from models.audience_settings import AudienceSetting
from models.audience_smarts_persons import AudienceSmartPerson
from models.enrichment.enrichment_users import EnrichmentUser
from models.enrichment.enrichment_user_contact import EnrichmentUserContact
from models.audience_postals_verification import AudiencePostalVerification
from models.enrichment.enrichment_employment_history import EnrichmentEmploymentHistory
from models.enrichment.enrichment_personal_profiles import EnrichmentPersonalProfiles
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

AUDIENCE_VALIDATION_AGENT_POSTAL = 'aud_validation_agent_postal'
AUDIENCE_VALIDATION_PROGRESS = 'AUDIENCE_VALIDATION_PROGRESS'
AUDIENCE_VALIDATION_FILLER = 'aud_validation_filler'
EXPERIANAPERTURE_API_KEY = os.getenv('EXPERIANAPERTURE_API_KEY')
EXPERIANAPERTURE_API_URL = os.getenv('EXPERIANAPERTURE_API_URL')

COLUMN_MAPPING = {
    'personal_email_validation_status': 'mx',
    'business_email_validation_status': 'mx',
    'personal_email_last_seen': 'recency',
    'business_email_last_seen_date': 'recency',
    'mobile_phone_dnc': 'dnc_filter',
    'cas_home_address': 'cas_home_address',
    'cas_office_address': 'cas_office_address',
}

def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )


async def send_sse(connection: RabbitMQConnection, user_id: int, data: dict):
    try:
        logging.info(f"send client throught SSE: {data, user_id}")
        await publish_rabbitmq_message(
            connection=connection,
            queue_name=f'sse_events_{str(user_id)}',
            message_body={
                "status": AUDIENCE_VALIDATION_PROGRESS,
                "data": data
            }
        )
    except Exception as e:
        logging.error(f"Error sending SSE: {e}")


async def process_rmq_message(message: IncomingMessage, db_session: Session, connection: RabbitMQConnection):
    try:
        message_body = json.loads(message.body)
        user_id = message_body.get("user_id")
        aud_smart_id = message_body.get("aud_smart_id")
        batch = message_body.get("batch")
        validation_type = message_body.get("validation_type")
        expected_count = message_body.get("count_persons_before_validation", -1)

        failed_ids = []
        verifications = []

        for record in batch:
            person_id = record.get("audience_smart_person_id")
            zip_code5 = record.get("zip_code5")
            city = record.get("city")
            state_name = record.get("state_name")

            is_verify = False
            if not zip_code5 or not city or not state_name:
                failed_ids.append(person_id)
                continue
            
            if random.random() < 0.5:
                failed_ids.append(person_id)
                continue
                

            # existing_verification = db_session.query(AudiencePostalVerification).filter(AudiencePostalVerification.zip_code5 == int(zip_code5)).first()

            # if not existing_verification:
            #     response = requests.get(
            #         EXPERIANAPERTURE_API_URL,
            #         params={
            #             "country_iso": "USA",
            #             "datasets": [
            #                 "us-address"
            #             ],
            #             "key": {
            #                 "type": "postal_code",
            #                 "value": zip_code5
            #             }
            #         },
            #         headers={
            #             "Auth-Token": EXPERIANAPERTURE_API_KEY
            #         }
            #     )
            #     response_data = response.json()

            #     logging.info(f"response: {response.status_code}")

            #     if response.status_code == 402: #No more credits
            #         failed_ids.append(person_id)
            #         continue

            #     elif response.status_code != 200 and not response_data.get("success"):
            #         logging.info(f"response: {response_data}")
            #         failed_ids.append(person_id)

            #     suggestions = response_data.get("result", {}).get("suggestions", [])
            #     for suggestion in suggestions:
            #         locality = suggestion.get("locality", {})
            #         city_in_api = locality.get("town", {}).get("name", "")
            #         state_name_in_api = locality.get("sub_region", {}).get("name", "")
            #         similarity_state_name = fuzz.ratio(state_name, state_name_in_api)
            #         similarity_city = fuzz.ratio(city, city_in_api)
                    
            #         logging.info(f"similarity city: {city} - {city_in_api} = {similarity_city}")
            #         logging.info(f"similarity state: {state_name} - {state_name_in_api} = {similarity_state_name}")

            #         if similarity_city > 70 and similarity_state_name > 70:
            #             is_verify = True
            #             break
                
            #     verifications.append(
            #         AudiencePostalVerification(
            #             zip_code5=zip_code5,
            #             is_verify=is_verify
            #         )
            #     )

            # else: 
            #     logging.info("There is such a Postal in our database")
            #     is_verify = existing_verification.is_verify
            

            # if not is_verify:
            #     failed_ids.append(person_id)

        
        
        success_ids = [
            rec["audience_smart_person_id"]
            for rec in batch
            if rec["audience_smart_person_id"] not in failed_ids
        ]
        
        if verifications:
            db_session.bulk_save_objects(verifications)
            db_session.flush()

        if failed_ids:
            db_session.bulk_update_mappings(
                AudienceSmartPerson,
                [
                    {"id": pid, "is_validation_processed": False, "is_valid": False}
                    for pid in failed_ids
                ],
            )
            db_session.flush()
            
        if success_ids:
            db_session.bulk_update_mappings(
                AudienceSmartPerson,
                [
                    {"id": pid, "is_validation_processed": False}
                    for pid in success_ids
                ],
            )
            db_session.flush()

        total_validated = db_session.scalar(
            select(func.count(AudienceSmartPerson.id)).where(
                AudienceSmartPerson.smart_audience_id == aud_smart_id,
                AudienceSmartPerson.is_valid.is_(True),
            )
        )
        validation_count = db_session.scalar(
            select(func.count(AudienceSmartPerson.id)).where(
                AudienceSmartPerson.smart_audience_id == aud_smart_id,
                AudienceSmartPerson.is_validation_processed.is_(False),
            )
        )
        print(validation_count)
        print(expected_count)
        if validation_count >= expected_count:
            aud_smart = db_session.get(AudienceSmart, aud_smart_id)
            validations = {}
            if aud_smart and aud_smart.validations:
                validations = json.loads(aud_smart.validations)
                key = COLUMN_MAPPING.get(validation_type)
                print(key)
                for cat in validations.values():
                    for rule in cat:
                        if key in rule:
                            rule[key]["processed"] = True
                aud_smart.validations = json.dumps(validations)

            await publish_rabbitmq_message(
                connection=connection,
                queue_name=AUDIENCE_VALIDATION_FILLER,
                message_body={
                    "aud_smart_id": str(aud_smart_id),
                    "user_id": user_id,
                    "validation_params": validations,
                },
            )
        db_session.commit()
        await send_sse(
            connection,
            user_id,
            {"smart_audience_id": aud_smart_id, "total_validated": total_validated},
        )
        logging.info("sent sse with total count")

        await message.ack()
            
    except Exception as e:
        logging.error(f"Error processing matching: {e}", exc_info=True)
        # await message.ack()
        return 


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
        logging.info("Starting processing...")
        rmq_connection = RabbitMQConnection()
        connection = await rmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)

        engine = create_engine(
            f"postgresql://{db_username}:{db_password}@{db_host}/{db_name}", pool_pre_ping=True
        )
        Session = sessionmaker(bind=engine)
        db_session = Session()

        queue = await channel.declare_queue(
            name=AUDIENCE_VALIDATION_AGENT_POSTAL,
            durable=True,
        )
        await queue.consume(
                functools.partial(process_rmq_message, connection=connection, db_session=db_session)
            )

        await asyncio.Future()

    except Exception:
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
