import logging
import os
import sys
import asyncio
import functools
import json
import logging
import os
import sys
current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from sqlalchemy import create_engine
from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from aio_pika import IncomingMessage
from config.rmq_connection import RabbitMQConnection
from services.integrations.base import IntegrationService
from dependencies import (IntegrationsPresistence, LeadsPersistence, AudiencePersistence, 
                          LeadOrdersPersistence, IntegrationsUserSyncPersistence, 
                          AWSService, UserDomainsPersistence, SuppressionPersistence, ExternalAppsInstallationsPersistence)


load_dotenv()

DATA_SYNC_INTEGRATION = 'data_sync_integration'


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )


async def ensure_integration(message: IncomingMessage, integration_service: IntegrationService):
    try:
        message_body = json.loads(message.body)
        service_name = message_body.get('service_name')
        
        service_map = {
            'klaviyo': integration_service.klaviyo,
            'meta': integration_service.meta,
            'omnisend': integration_service.omnisend,
            'mailchimp': integration_service.mailchimp,
            'sendlane': integration_service.sendlane,
            'zapier': integration_service.zapier
        }
        
        service = service_map.get(service_name)

        if service:
            await service.process_data_sync(message_body)
            await message.ack()
            logging.info(f"Processed message for service: {service_name}")
        else:
            logging.error(f"Invalid service name: {service_name}")
            await message.reject(requeue=True)
            return

    except Exception as e:
        logging.error("Error processing message", exc_info=True)
        await asyncio.sleep(5)
        await message.reject(requeue=True)

    
async def main():
    logging.info("Started")
    
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

        queue = await channel.declare_queue(
            name=DATA_SYNC_INTEGRATION,
            durable=True,
        )
        engine = create_engine(
            f"postgresql://{db_username}:{db_password}@{db_host}/{db_name}", pool_pre_ping=True
        )
        Session = sessionmaker(bind=engine)
        session = Session()
        integration_service = IntegrationService(
            db=session,
            integration_persistence=IntegrationsPresistence(session),
            lead_persistence=LeadsPersistence(session),
            audience_persistence=AudiencePersistence(session),
            lead_orders_persistence=LeadOrdersPersistence(session),
            integrations_user_sync_persistence=IntegrationsUserSyncPersistence(session),
            aws_service=AWSService(),
            domain_persistence=UserDomainsPersistence(session),
            suppression_persistence=SuppressionPersistence(session),
            epi_persistence=ExternalAppsInstallationsPersistence(session)
        )
        with integration_service as service:
            await queue.consume(
                functools.partial(ensure_integration, integration_service=service)
            )
            await asyncio.Future()

    except Exception as err:
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