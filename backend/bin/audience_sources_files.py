import logging
import os
import sys
import asyncio
import functools
import json
import io
import csv
import boto3
from datetime import datetime
from typing import Dict, List, Optional
from collections import defaultdict
import aiohttp
import requests
from aio_pika import IncomingMessage, Message
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

from models.audience import Audience
from models.five_x_five_emails import FiveXFiveEmails
from models.five_x_five_users_emails import FiveXFiveUsersEmails
from models.audience_sources import AudienceSource
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from config.rmq_connection import RabbitMQConnection
from bigcommerce.api import BigcommerceApi
from utils import get_utc_aware_date

load_dotenv()

AUDIENCE_SOURCES_MATCHING= 'aud_sources_matching'
AUDIENCE_SOURCES_READER= 'aud_sources_reader'
S3_BUCKET_NAME = "maximiz-data"

def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

async def aud_sources_reader(message, session: Session):
    try:
        message_body = json.loads(message.body)
        data = message_body.get('data')
        if not data:
            logging.warning("Message data is missing.")
            await message.ack()
            return
        
        source_id = data.get('source_id')
        email_field = data.get('email') 
        logging.info(f"Processing AudienceSource with ID: {source_id}")


        source = session.query(AudienceSource).filter_by(id=source_id).first()
        if not source:
            logging.warning(f"AudienceSource with ID {source_id} not found.")
            await message.ack()
            return

        file_url = source.file_url
        if not file_url:
            logging.warning(f"File URL is missing for AudienceSource ID {source_id}.")
            await message.ack()
            return

        key = extract_key_from_url(file_url)
        s3_client = boto3.client("s3")
        response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=key)
        csv_file = io.StringIO(response["Body"].read().decode("utf-8"))

        csv_reader = csv.DictReader(csv_file)
        total_rows = 0
        processed_rows = 0

        # connect to RabbitMQ for send in queue matching
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)

        queue = await channel.declare_queue(
            name=AUDIENCE_SOURCES_MATCHING,
            durable=True,
        )

        for row in csv_reader:
            total_rows += 1
            email = row.get(email_field)
            if email:
                # send email in the second queue
                await queue.publish(
                    Message(body=json.dumps({data: {"email": email, "source_id": source_id, 'row': row}}).encode())
                )

        # update total
        source = session.query(AudienceSource).filter_by(id=source_id).first()
        if source:
            source.total = total_rows
            session.commit()

        # send SSE with progress
        await send_sse({"source_id": source_id, "total": total_rows, "processed": processed_rows})

        # susbscribe queue result 
        # await channel.consume(
        #     functools.partial(aud_sources_results_handler, session=session)
        # )

        await message.ack()

    except Exception as e:
        logging.error(f"Error processing message: {e}", exc_info=True)
        await message.nack()


# async def aud_sources_results_handler(message, session: Session):
#     try:
#         message_body = json.loads(message.body)
        
#         source_id = message_body.get("source_id")
#         result_data = message_body.get("result_data")

#         if not source_id or not result_data:
#             logging.warning("Invalid message format: Missing source_id or result_data.")
#             await message.ack()
#             return
        
#         logging.info(f"Received results for AudienceSource ID: {source_id}")
        
#         # сhanging status AudienceSource in DB
#         audience_source = session.query(AudienceSource).filter_by(id=source_id).first()
#         if audience_source:
#             audience_source.status = "processed"
#             audience_source.result_data = json.dumps(result_data)
#             session.commit()
        
#         # send SSE with result
#         # await send_sse_update(source_id, result_data)

#         await message.ack()

    except Exception as e:
        logging.error(f"Error in aud_sources_results_handler: {e}", exc_info=True)
        await message.nack(requeue=False)



async def aud_sources_matching(message, session: Session):
    try:
        message_body = json.loads(message.body)
        data = message_body.get('data')
        if not data:
            logging.warning("Message data is missing.")
            await message.ack()
            return
        
        email = data.get("email")
        row = data.get("row")
        source_id = data.get("source_id")

        logging.info(f"Processing AudienceSource with ID: {source_id}")

        email_record = session.query(FiveXFiveEmails).filter_by(email=email).first()
        if email_record:
            user_id = session.query(FiveXFiveUsersEmails.user_id).filter_by(email_id=email_record.id).scalar()

            matched_person = AudienceSourcesMatchedPerson(
                source_id=source_id,
                five_x_five_user_id=user_id,
                mapped_fields=json.dumps(row),
            )
            session.add(matched_person)
            session.commit()

        await message.ack()

    except Exception as e:
        logging.error(f"Error processing matching: {e}", exc_info=True)
        await message.nack()



def extract_key_from_url(s3_url: str):
    parsed_url = s3_url.split("amazonaws.com/", 1)
    if len(parsed_url) != 2:
        raise ValueError(f"Invalid S3 URL format: {s3_url}")
    return parsed_url[1].split("?", 1)[0]

async def send_sse(data):
    # {"source_id": int, "total": int, "processed": int}
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post("http://your-sse-endpoint", json=data) as resp:
                if resp.status != 200:
                    logging.warning(f"Failed to send SSE: {resp.status}")
    except Exception as e:
        logging.error(f"Error sending SSE: {e}")

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
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)

        engine = create_engine(
            f"postgresql://{db_username}:{db_password}@{db_host}/{db_name}", pool_pre_ping=True
        )
        Session = sessionmaker(bind=engine)
        session = Session()
        
        reader_queue = await channel.declare_queue(
            name=AUDIENCE_SOURCES_READER,
            durable=True,
        )
        await reader_queue.consume(functools.partial(aud_sources_reader, session=session))

        matching_queue = await channel.declare_queue(
            name=AUDIENCE_SOURCES_MATCHING,
            durable=True,
        )
        await matching_queue.consume(functools.partial(aud_sources_matching, session=session))

        await asyncio.Future()

    except Exception:
        logging.error('Unhandled Exception:', exc_info=True)

    finally:
        if session:
            logging.info("Closing the database session...")
            session.close()
        if rabbitmq_connection:
            logging.info("Closing RabbitMQ connection...")
            await rabbitmq_connection.close()
        logging.info("Shutting down...")

if __name__ == "__main__":
    asyncio.run(main())