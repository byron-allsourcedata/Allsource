import logging
import os
import sys
import asyncio
import functools
import json
import boto3
from sqlalchemy import update
from aio_pika import IncomingMessage, Message
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models.audience_smarts import AudienceSmart
from models.audience_smarts_persons import AudienceSmartPerson
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

AUDIENCE_SMARTS_AGENT = 'aud_smarts_agent'
AUDIENCE_LOOKALIKES_PROGRESS = "AUDIENCE_LOOKALIKES_PROGRESS"
AUDIENCE_SMARTS_PROGRESS = "AUDIENCE_SMARTS_PROGRESS"

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
                "status": AUDIENCE_SMARTS_PROGRESS,
                "data": data
            }
        )
    except Exception as e:
        logging.error(f"Error sending SSE: {e}")


async def aud_smarts_matching(message: IncomingMessage, db_session: Session, connection):
    try:
        message_body = json.loads(message.body)
        user_id = message_body.get("user_id")
        aud_smart_id = message_body.get("aud_smart_id")
        enrichment_users_ids = message_body.get("enrichment_users_ids") or []

        bulk_data = [
            {"smart_audience_id": str(aud_smart_id), "enrichment_user_id": enrichment_user_id}
            for enrichment_user_id in enrichment_users_ids
        ]

        db_session.bulk_insert_mappings(AudienceSmartPerson, bulk_data)
        db_session.flush() 

        logging.info(f"inserted {len(enrichment_users_ids)} persons") 

        processed_records = db_session.execute(
            update(AudienceSmart)
            .where(AudienceSmart.id == str(aud_smart_id))
            .values(
                processed_active_segment_records=(AudienceSmart.processed_active_segment_records + len(enrichment_users_ids))
            )
            .returning(AudienceSmart.processed_active_segment_records)
        ).fetchone()
                    
        db_session.commit()
            
        processed_records_value = processed_records[0] if processed_records else 0

        await send_sse(connection, user_id, {"smart_audience_id": aud_smart_id, "processed": processed_records_value})
        logging.info(f"sent {len(enrichment_users_ids)} persons")
        await message.ack()

    except Exception as e:
        logging.error(f"Error processing matching: {e}", exc_info=True)
        await message.nack()


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
            name=AUDIENCE_SMARTS_AGENT,
            durable=True,
        )
        await queue.consume(
                functools.partial(aud_smarts_matching, connection=connection, db_session=db_session)
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