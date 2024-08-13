import asyncio
import functools
import gzip
import json
import logging
import os
import sys
import tempfile

import aioboto3
import boto3
import pandas as pd

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from dotenv import load_dotenv
from config.rmq_connection import RabbitMQConnection
from models.five_x_five_hems import FiveXFiveHems
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv()
logging.basicConfig(level=logging.INFO)

# Configuration
BUCKET_NAME = 'trovo-coop-shakespeare'
FILES_PATH = 'outgoing/upid_hem_1_6_0'
LAST_PROCESSED_FILE_PATH = 'tmp/last_processed_file_hems.txt'


def create_sts_client(key_id, key_secret):
    return boto3.client(
        'sts',
        aws_access_key_id=key_id,
        aws_secret_access_key=key_secret,
        region_name='us-west-2'
    )


def assume_role(role_arn, sts_client):
    credentials = sts_client.assume_role(
        RoleArn=role_arn,
        RoleSessionName="create-use-assume-role-scenario"
    )['Credentials']
    logging.info(f"Assumed role '{role_arn}', got temporary credentials.")
    return credentials


async def on_message_received(message, s3_session, credentials, db_session):
    async with message.process():
        try:
            message_json = json.loads(message.body)
            async with s3_session.client(
                    's3',
                    region_name='us-west-2',
                    aws_access_key_id=credentials['AccessKeyId'],
                    aws_secret_access_key=credentials['SecretAccessKey'],
                    aws_session_token=credentials['SessionToken']
            ) as s3:
                s3_obj = await s3.get_object(Bucket=BUCKET_NAME, Key=message_json['file_name'])
                async with s3_obj["Body"] as body:
                    with tempfile.NamedTemporaryFile(delete=True) as temp_file:
                        file_data = await body.read()
                        temp_file.write(file_data)
                        temp_file.seek(0)
                        with gzip.open(temp_file.name, 'rt', encoding='utf-8') as f:
                            df = pd.read_csv(f)
                        for _, row in df.iterrows():
                            five_x_five_hems = FiveXFiveHems(
                                up_id=str(row['UP_ID']),
                                sha256_lc_hem=str(row['SHA256_LC_HEM']),
                                md5_lc_hem=str(row['MD5_LC_HEM']),
                                sha1_lc_hem=str(row['SHA1_LC_HEM'])
                            )
                            db_session.add(five_x_five_hems)
                        db_session.commit()
            logging.info(f"{message_json['file_name']} processed")
        except Exception as e:
            logging.error(f"Error processing message: {e}", exc_info=True)


async def main():
    logging.info("Started")
    try:
        sts_client = create_sts_client(os.getenv('S3_KEY_ID'), os.getenv('S3_KEY_SECRET'))
        credentials = assume_role(os.getenv('S3_ROLE_ARN'), sts_client)

        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        queue = await channel.declare_queue(
            name='5x5_import_hems',
            durable=True,
        )

        engine = create_engine(
            f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
        )
        Session = sessionmaker(bind=engine)
        db_session = Session()

        session = aioboto3.Session()
        await queue.consume(
            functools.partial(on_message_received, s3_session=session, credentials=credentials, db_session=db_session)
        )
        await asyncio.Future()
    except Exception as err:
        logging.error('Unhandled Exception:', exc_info=True)
    finally:
        logging.info('Shutting down...')
        await rabbitmq_connection.close()


if __name__ == "__main__":
    asyncio.run(main())