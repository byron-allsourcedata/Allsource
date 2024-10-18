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
from dotenv import load_dotenv
import time
load_dotenv()
logging.basicConfig(level=logging.INFO)

PLATFORMS = ['BigCommerce', 'Shopify']


if __name__ == '__main__':
    engine = create_engine(
        f"postgresql://{os.getenv('DB_USERNAME')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
    )
    Session = sessionmaker(bind=engine)
    
    rmq_connection = RabbitMQConnection()
    
    with Session() as session: 
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
        while True:
            with integration_service as service:
                for platforn in PLATFORMS:
                    integrations = service.shopify.integration_persistence.get_all_integrations_filter_by(service_name=platforn)
                    for integration in integrations:
                        integration_platform = getattr(integration_service, platforn.lower())
                        integration_platform.order_sync(integration.domain_id)
            time.sleep(60*60*2)