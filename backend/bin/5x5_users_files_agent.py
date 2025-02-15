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
from config.rmq_connection import publish_rabbitmq_message
from config.rmq_connection import RabbitMQConnection
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)

BUCKET_NAME = 'trovo-coop-shakespeare'
QUEUE_USERS_FILES = '5x5_users_files'
QUEUE_USERS_ROWS = '5x5_users_rows'


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


async def on_message_received(message_body, s3_session, rmq_connection):
        sts_client = create_sts_client(os.getenv('S3_KEY_ID'), os.getenv('S3_KEY_SECRET'))
        credentials = assume_role(os.getenv('S3_ROLE_ARN'), sts_client)
        message_json = json.loads(message_body)
        logging.info(f"{message_json['file_name']} started")
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
                    rows_counter = 0
                    for _, row in df.iterrows():
                        await publish_rabbitmq_message(
                            connection=rmq_connection,
                            queue_name=QUEUE_USERS_ROWS,
                            message_body={'user': row.to_dict()}
                        )
                        rows_counter += 1
                    logging.info(f"{rows_counter} rows processed")
        logging.info(f"{message_json['file_name']} processed")

async def main():
    logging.info("Started")
    try:
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        queue = await channel.declare_queue(
            name=QUEUE_USERS_FILES,
            durable=True,
            arguments={
                'x-consumer-timeout': 3600000,
            }
        )
        await channel.declare_queue(
            name=QUEUE_USERS_ROWS,
            durable=True,
            arguments={
                'x-consumer-timeout': 3600000,
            }
        )
        session = aioboto3.Session()
        
        while(True):
            channel = await connection.channel()
            queue = await channel.get_queue(QUEUE_USERS_FILES)
            message = await queue.get(no_ack=False)
            if message:
                await message.ack()
                await on_message_received(message.body, session, connection)
            else:
                logging.info("No message returned")
                await asyncio.sleep(5) 
                break
            await channel.close()
        await connection.close()
    except Exception as err:
        logging.error('Unhandled Exception:', exc_info=True)
    finally:
        if rabbitmq_connection:
            logging.info("Closing RabbitMQ connection...")
            await rabbitmq_connection.close()
        await asyncio.sleep(10)


if __name__ == "__main__":
    asyncio.run(main())
