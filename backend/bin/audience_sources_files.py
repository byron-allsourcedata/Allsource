import logging
import os
import sys
import asyncio
import functools
import json
import io
import csv
import boto3
import aioboto3
from aio_pika import IncomingMessage, Message, Connection
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models.five_x_five_emails import FiveXFiveEmails
from models.five_x_five_users_emails import FiveXFiveUsersEmails
from models.audience_sources import AudienceSource
from models.users import Users
from models.five_x_five_users import FiveXFiveUser
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from config.rmq_connection import RabbitMQConnection

load_dotenv()

AUDIENCE_SOURCES_MATCHING= 'aud_sources_matching'
AUDIENCE_SOURCES_READER= 'aud_sources_reader'
S3_BUCKET_NAME = "maximiz-data"


async def publish_rabbitmq_message(channel, queue_name: str, message_body: dict):
    try:
        json_data = json.dumps(message_body).encode("utf-8")
        message = Message(
            body=json_data
        )
        await channel.default_exchange.publish(message, routing_key=queue_name)
    except Exception as e:
        logging.error(f"Failed to publish message: {e}")


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

def create_sts_client(key_id, key_secret):
    return boto3.client(
        'sts',
        aws_access_key_id=key_id,
        aws_secret_access_key=key_secret,
        region_name='us-east-2'
    )

def assume_role(role_arn, sts_client):
    credentials = sts_client.assume_role(
        RoleArn=role_arn,
        RoleSessionName="create-use-assume-role-scenario"
    )['Credentials']
    logging.info(f"Assumed role '{role_arn}', got temporary credentials.")
    return credentials

async def aud_sources_reader(message: IncomingMessage, db_session: Session, s3_session, channel):
    try:
        message_body = json.loads(message.body)
        data = message_body.get('data')
        if not data:
            logging.warning("Message data is missing.")
            await message.ack()
            return
        
        source_id = data.get('source_id')
        user_id = data.get('user_id') 
        email_field = data.get('email') 
        logging.info(f"Processing AudienceSource with ID: {source_id}")#ydalit

        source = db_session.query(AudienceSource).filter_by(id=source_id).first()
        if not source:
            logging.warning(f"AudienceSource with ID {source_id} not found.")
            await message.ack()
            return

        file_url = source.file_url
        if not file_url:
            logging.warning(f"File URL is missing for AudienceSource ID {source_id}.")
            await message.ack()
            return

        sts_client = create_sts_client(os.getenv('S3_KEY_ID'), os.getenv('S3_KEY_SECRET'))
        credentials = assume_role(os.getenv('S3_ROLE_ARN'), sts_client)
        key = extract_key_from_url(file_url)
        async with s3_session.client(
                's3',
                region_name='us-east-2',
                aws_access_key_id=credentials['AccessKeyId'],
                aws_secret_access_key=credentials['SecretAccessKey'],
                aws_session_token=credentials['SessionToken']
        ) as s3:
            s3_obj = await s3.get_object(Bucket=S3_BUCKET_NAME, Key=key)
            s3_obj = await s3.get_object(Bucket=S3_BUCKET_NAME, Key=key)
            body = await s3_obj['Body'].read()

            csv_file = io.StringIO(body.decode("utf-8"))
            csv_reader = csv.DictReader(csv_file)
        
        total_rows = sum(1 for _ in csv_reader) - 1
        csv_file.seek(0)
        processed_rows = 0

        # async with db_session.begin():  # Open a transaction
        source.total_records = total_rows
        db_session.add(source)

        for row in csv_reader:
            email = row.get(email_field)
            if email:
                # Send email to the matching queue
                await publish_rabbitmq_message(
                    channel=channel,
                    queue_name=AUDIENCE_SOURCES_MATCHING,
                    message_body={
                        "data": {"email": email, "source_id": source_id, "row": row}
                    }
                )
                processed_rows += 1

                source.processed_records = processed_rows
                if processed_rows == total_rows:
                    source.matched_records_status = "complete"
                db_session.add(source)
                await send_sse(channel, user_id, {"source_id": source_id, "total": total_rows, "processed": processed_rows})
                db_session.commit()

        await message.ack()

    except Exception as e:
        logging.error(f"Error processing message: {e}", exc_info=True)
        await message.nack()


async def aud_sources_matching(message: IncomingMessage, db_session: Session):
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

        logging.info(f"Processing AudienceSourceMatching with ID: {source_id}")#ydalit

        email_record = db_session.query(FiveXFiveEmails).filter_by(email=email).first()
        if email_record:
            user_id = db_session.query(FiveXFiveUsersEmails.user_id).filter_by(email_id=email_record.id).scalar()

            matched_person = AudienceSourcesMatchedPerson(
                source_id=source_id,
                five_x_five_user_id=user_id,
                mapped_fields=json.dumps(row),
            )
            db_session.add(matched_person)
            db_session.commit()

        await message.ack()

    except Exception as e:
        logging.error(f"Error processing matching: {e}", exc_info=True)
        await message.nack()


def extract_key_from_url(s3_url: str):
    parsed_url = s3_url.split("amazonaws.com/", 1)
    if len(parsed_url) != 2:
        raise ValueError(f"Invalid S3 URL format: {s3_url}")
    return parsed_url[1].split("?", 1)[0]


async def send_sse(channel, user_id: int, data):
    # {"source_id": int, "total": int, "processed": int}
    try:
        logging.info(f"SSE: {data, user_id}")
        await publish_rabbitmq_message(
                    channel=channel,
                    queue_name=f'sse_events_{user_id}',
                    message_body={
                        "data": data
                    }
                )
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
        
        reader_queue = await channel.declare_queue(
            name=AUDIENCE_SOURCES_READER,
            durable=True,
        )
        await reader_queue.consume(functools.partial(aud_sources_reader, db_session=db_session, s3_session=s3_session, channel=channel))

        matching_queue = await channel.declare_queue(
            name=AUDIENCE_SOURCES_MATCHING,
            durable=True,
        )
        await matching_queue.consume(functools.partial(aud_sources_matching, db_session=db_session))

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