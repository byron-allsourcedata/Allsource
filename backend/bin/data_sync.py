import asyncio
import functools
import json
import logging
import os
import sys
current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from config.aws import get_s3_client

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from aio_pika import connect, IncomingMessage

from config.rmq_connection import RabbitMQConnection
from services.integrations.base import IntegrationService
from dependencies import (IntegrationsPresistence, LeadsPersistence, AudiencePersistence, 
                          LeadOrdersPersistence, IntegrationsUserSyncPersistence, 
                          AWSService, UserDomainsPersistence, SuppressionPersistence)

logging.basicConfig(level=logging.INFO)

QUEUE_NAME = 'data_sync_leads'

async def on_message_received(message: IncomingMessage, session):
    try:
        message_body = json.loads(message.body)
        await process_data_sync(message_body, session)

        await message.ack()
        logging.info(f"Processed message: {message_body}")

    except Exception as e:
        logging.error("Error processing message: %s", e, exc_info=True)
        try:
            await message.reject(requeue=True)
        except Exception as ack_error:
            logging.error("Error acknowledging message: %s", ack_error, exc_info=True)
        await asyncio.sleep(5)

async def process_data_sync(message_body, session):
    integration_service = IntegrationService(
        db=session,
        integration_persistence=IntegrationsPresistence(session),
        lead_persistence=LeadsPersistence(session),
        audience_persistence=AudiencePersistence(session),
        lead_orders_persistence=LeadOrdersPersistence(session),
        integrations_user_sync_persistence=IntegrationsUserSyncPersistence(session),
        aws_service=AWSService(get_s3_client()),
        domain_persistence=UserDomainsPersistence(session),
        suppression_persistence=SuppressionPersistence(session)
    )
    with integration_service as service:
        service.klaviyo.process_data_sync(message_body)
        service.meta.process_data_sync(message_body)
        service.omnisend.process_data_sync(message_body)
        service.mailchimp.process_data_sync(message_body)

async def consume(rmq_connection: RabbitMQConnection, db_session):
    connection = await rmq_connection.connect()
    async with connection:
        channel = await connection.channel()  
        await channel.set_qos(prefetch_count=1)
        queue = await channel.declare_queue(QUEUE_NAME, durable=True)
        await queue.consume(
            functools.partial(on_message_received, session=db_session)
        )
        logging.info(f"Waiting for messages in queue: {QUEUE_NAME}")
        try:
            stop_event = asyncio.Event()
            while not stop_event.is_set(): 
                await asyncio.sleep(1) 
        except asyncio.CancelledError:
            logging.info("Consumption cancelled.")

if __name__ == '__main__':
    engine = create_engine(
        f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
    )
    Session = sessionmaker(bind=engine)
    
    rmq_connection = RabbitMQConnection()
    
    with Session() as db_session: 
        asyncio.run(consume(rmq_connection, db_session))
