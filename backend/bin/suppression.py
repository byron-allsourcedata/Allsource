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
from services.integrations.base import IntegrationService
from dependencies import (IntegrationsPresistence, LeadsPersistence, AudiencePersistence, 
                          LeadOrdersPersistence, IntegrationsUserSyncPersistence, 
                          AWSService, UserDomainsPersistence, SuppressionPersistence)
import time 
FIELD = ['id', 'email', 'phone_number']


if __name__ == '__main__':
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
        suppression_persistence=SuppressionPersistence(db_session)
    )
    while True:
        logging.info('Start suppression sync')
        integrations = integration_service.integration_persistence.get_all_integrations_filter_by(suppression=True)
        for integration in integrations:
            last_suppression_date = integration_service.suppression_persistence.get_last_leads_suppression(domain_id=integration.domain_id, integration_id=integration.id)
            with integration_service as service:
                service = getattr(integration_service, integration.service_name.lower())
                if last_suppression_date:
                    contact = service.get_profile(integration.domain_id, date_last_sync=last_suppression_date.created_at, fileds=FIELD)
                else: contacts = service.get_profile(integration.domain_id, fields=FIELD)
                for contact in contacts:
                    integration_service.suppression_persistence.create({
                        'email': contact.email,
                        'phone_number': contact.phone_number,
                        'domain_id': integration.domain_id,
                        'integrations_id': integration.id
                    })
        logging.info('Stop suppression sync')
        time.sleep(12*60*60)
