import asyncio
import logging
import os
import sys

import aioboto3
import boto3

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from dotenv import load_dotenv
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection

load_dotenv()
logging.basicConfig(level=logging.INFO)

BUCKET_NAME = 'trovo-coop-shakespeare'
FILES_PATH = 'outgoing/upid_hem_1_6_0'
LAST_PROCESSED_FILE_PATH = 'tmp/last_processed_file_hems.txt'
QUEUE_IMPORT_HEMS = '5x5_import_hems'

def create_sts_client(key_id, key_secret):
    return boto3.client('sts', aws_access_key_id=key_id, aws_secret_access_key=key_secret, region_name='us-west-2')


def assume_role(role_arn, sts_client):
    credentials = sts_client.assume_role(RoleArn=role_arn, RoleSessionName="create-use-assume-role-scenario")[
        'Credentials']
    logging.info(f"Assumed role '{role_arn}', got temporary credentials.")
    return credentials


async def process_files(sts_client, rmq_conn):
    credentials = assume_role(os.getenv('S3_ROLE_ARN'), sts_client)
    session = aioboto3.Session()
    async with session.resource('s3', region_name='us-west-2', aws_access_key_id=credentials['AccessKeyId'],
                        aws_secret_access_key=credentials['SecretAccessKey'],
                        aws_session_token=credentials['SessionToken']) as s3:

        bucket = await s3.Bucket(BUCKET_NAME)
        async for s3_object in bucket.objects.filter(Prefix=FILES_PATH):
            await publish_rabbitmq_message(
                connection=rmq_conn,
                queue_name=QUEUE_IMPORT_HEMS,
                message_body={'file_name': s3_object.key}
            )
            logging.info(f"write last processed file {s3_object.key}")


async def main():
    logging.info("Started")
    sts_client = create_sts_client(os.getenv('S3_KEY_ID'), os.getenv('S3_KEY_SECRET'))
    rabbitmq_connection = RabbitMQConnection()
    connection = await rabbitmq_connection.connect()
    channel = await connection.channel()
    await channel.declare_queue(
        name=QUEUE_IMPORT_HEMS,
        durable=True,
        arguments={
            'x-consumer-timeout': 7200000,
        }
    )
    await process_files(sts_client, connection)

asyncio.run(main())
