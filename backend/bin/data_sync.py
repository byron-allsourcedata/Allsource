import asyncio
import functools
import json
import logging
import os
import sys
import traceback

import httpx
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
                          AWSService, UserDomainsPersistence, SuppressionPersistence, ExternalAppsInstallationsPersistence)

logging.basicConfig(level=logging.INFO)

QUEUE_NAME = 'data_sync_leads'


async def on_message_received(message: IncomingMessage, integration_service):
    try:
        message_body = json.loads(message.body)
        await process_data_sync(message_body, integration_service)
        await message.ack()
        logging.info(f"Processed message: {message_body}")
    except Exception as e:
        logging.error("excepted message. error", exc_info=True)
        await asyncio.sleep(5)
        await message.reject(requeue=True)



async def process_data_sync(message_body, integration_service: IntegrationService):
    await integration_service.klaviyo.process_data_sync(message_body)
    integration_service.meta.process_data_sync(message_body)
    await integration_service.omnisend.process_data_sync(message_body)
    await integration_service.mailchimp.process_data_sync(message_body)
    await integration_service.sendlane.process_data_sync(message_body)
    await integration_service.zapier.process_data_sync(message_body)

async def main():
    logging.info("Started")
    db_session = None
    rabbitmq_connection = None
    try:
        rabbitmq_connection = RabbitMQConnection()
        connection = await rabbitmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        queue = await channel.declare_queue(
            name=QUEUE_NAME,
            durable=True,
        )
        engine = create_engine(
            f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
        )
        Session = sessionmaker(bind=engine)
        db_session = Session()
        integration_service = IntegrationService(
                db=db_session,
                integration_persistence=IntegrationsPresistence(db_session),
                lead_persistence=LeadsPersistence(db_session), 
                audience_persistence=AudiencePersistence(db_session),
                lead_orders_persistence=LeadOrdersPersistence(db_session),
                integrations_user_sync_persistence=IntegrationsUserSyncPersistence(db_session),
                aws_service=AWSService(get_s3_client()),
                domain_persistence=UserDomainsPersistence(db_session),
                suppression_persistence=SuppressionPersistence(db_session),
                epi_persistence=ExternalAppsInstallationsPersistence(db_session)
            )
        with integration_service as service:
            await queue.consume(
                functools.partial(on_message_received, integration_service=service)
            )
            await asyncio.Future()
    except Exception as err:
        logging.error('Unhandled Exception:', exc_info=True)
    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        if rabbitmq_connection:
            logging.info("Closing RabbitMQ connection...")
            await rabbitmq_connection.close()
        logging.info("Shutting down...")


if __name__ == "__main__":
    asyncio.run(main())