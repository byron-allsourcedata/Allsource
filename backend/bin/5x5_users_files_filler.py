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
FILE_PATH = 'outgoing/universal_person_2_7_0/'
REGION_NAME = 'us-west-2'
DB_NAME = '5x5_users'
QUEUE_IMPORT_NAME = '5x5_import'

def create_sts_client(key_id, key_secret):
    return boto3.client('sts',
                        aws_access_key_id=key_id,
                        aws_secret_access_key=key_secret,
                        region_name=REGION_NAME)


def assume_role(role_arn, sts_client):
    response = sts_client.assume_role(RoleArn=role_arn, RoleSessionName='create-use-assume-role-scenario')
    credentials = response['Credentials']
    logging.info(f"Assumed role '{role_arn}', got temporary credentials.")
    return credentials


async def process_files(sts_client, rmq_conn):
    credentials = assume_role(os.getenv('S3_ROLE_ARN'), sts_client)
    session = aioboto3.Session()
    async with session.resource('s3', region_name='us-west-2', aws_access_key_id=credentials['AccessKeyId'],
                                aws_secret_access_key=credentials['SecretAccessKey'],
                                aws_session_token=credentials['SessionToken']) as s3:
        bucket = await s3.Bucket(BUCKET_NAME)
        async for s3_object in bucket.objects.filter(Prefix=FILE_PATH):
            await publish_rabbitmq_message(
                connection=rmq_conn,
                queue_name='5x5_import',
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
        name=QUEUE_IMPORT_NAME,
        durable=True,
        arguments={
            'x-message-ttl': 300000
        }
    )
    await process_files(sts_client, connection)


asyncio.run(main())
