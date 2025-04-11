import asyncio
import logging
import os
import sys
current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection
from sqlalchemy import create_engine, select
from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime, timezone
from enums import DataSyncImportedStatus, ProccessDataSyncResult, AudienceSmartStatuses
from utils import get_utc_aware_date
from models.enrichment_users import EnrichmentUser
from typing import Optional
from uuid import UUID
from models.audience_smarts_persons import AudienceSmartPerson
from models.audience_smarts import AudienceSmart
from sqlalchemy.dialects.postgresql import insert
from services.subscriptions import SubscriptionService
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from models.audience_data_sync_imported_persons import AudienceDataSyncImportedPersons
from dependencies import (PlansPersistence)

load_dotenv()

AUDIENCE_DATA_SYNC_PERSONS = 'audience_data_sync_persons'
BATCH_SIZE = 500
LONG_SLEEP = 60 * 10
SHORT_SLEEP = 10

def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

async def send_leads_to_queue(rmq_connection, msg):
    await publish_rabbitmq_message(
        connection=rmq_connection,
        queue_name=AUDIENCE_DATA_SYNC_PERSONS,
        message_body=msg
    )

def fetch_data_syncs(session):
    results = session.query(UserIntegration, IntegrationUserSync)\
            .join(IntegrationUserSync, IntegrationUserSync.integration_id == UserIntegration.id)\
            .all()
    user_integrations = [res[0] for res in results]
    data_syncs = [res[1] for res in results]

    return user_integrations, data_syncs

def get_no_of_imported_success_contacts(session, data_sync_id):
    return session.query(AudienceDataSyncImportedPersons).filter(
        AudienceDataSyncImportedPersons.status == DataSyncImportedStatus.SUCCESS.value, 
        AudienceDataSyncImportedPersons.data_sync_id == data_sync_id
    ).count()
    
def get_no_of_imported_contacts(session, data_sync_id):
    return session.query(AudienceDataSyncImportedPersons).filter(
        AudienceDataSyncImportedPersons.status != DataSyncImportedStatus.SENT.value, 
        AudienceDataSyncImportedPersons.data_sync_id == data_sync_id
    ).count()

def update_data_sync_integration(session, data_sync_id, data_sync: IntegrationUserSync, last_sync_date=True):
    no_of_success_contacts = get_no_of_imported_success_contacts(session=session, data_sync_id=data_sync_id)
    no_of_contacts = get_no_of_imported_contacts(session=session, data_sync_id=data_sync_id)
    update_data = {
        'no_of_contacts': no_of_success_contacts
    }
    if last_sync_date:
        update_data['last_sync_date'] = get_utc_aware_date()

    session.query(IntegrationUserSync).filter(IntegrationUserSync.id == data_sync_id).update(update_data)
    session.flush()
    
    if no_of_contacts == data_sync.sent_contacts:
        session.query(AudienceSmart)\
        .filter(AudienceSmart.id == data_sync.smart_audience_id)\
        .update({AudienceSmart.status: AudienceSmartStatuses.SYNCED.value}, synchronize_session=False)

    session.commit()
    return no_of_contacts

def fetch_enrichment_users_by_data_sync(
    session: Session,
    data_sync_id: int,
    limit: int,
    last_sent_enrichment_id: Optional[UUID] = None
):
    query = (
        session
        .query(EnrichmentUser)
        .join(AudienceSmartPerson, AudienceSmartPerson.enrichment_user_id == EnrichmentUser.id)
        .join(AudienceSmart, AudienceSmart.id == AudienceSmartPerson.smart_audience_id)
        .join(IntegrationUserSync, IntegrationUserSync.smart_audience_id == AudienceSmart.id)
        .filter(IntegrationUserSync.id == data_sync_id)
    )
    
    if last_sent_enrichment_id is not None:
        query = query.filter(EnrichmentUser.id > last_sent_enrichment_id)

    result = query.order_by(EnrichmentUser.id).limit(limit).all()
    return result

def update_last_sent_encrihment_user(session, data_sync_id, last_encrichment_id):
    session.query(IntegrationUserSync).filter(
        IntegrationUserSync.id == data_sync_id
    ).update({IntegrationUserSync.last_sent_enrichment_id: last_encrichment_id})
    session.commit()
    
def update_data_sync_imported_leads(session, status, data_sync_id):
    session.db.query(AudienceDataSyncImportedPersons).filter(AudienceDataSyncImportedPersons.id == data_sync_id).update({
            'status': status
            })
    session.db.commit()

def get_previous_imported_encrhment_users(session, data_sync_id, data_sync_limit, service_name):
    query = session.query(
        EnrichmentUser.id,
    ).join(
        AudienceSmartPerson, AudienceSmartPerson.enrichment_user_id == EnrichmentUser.id
    ).join(
        AudienceDataSyncImportedPersons, AudienceDataSyncImportedPersons.enrichment_user_id == EnrichmentUser.id
    ).join(
        AudienceSmart, AudienceSmart.id == AudienceSmartPerson.smart_audience_id
    ).join(
        IntegrationUserSync, IntegrationUserSync.smart_audience_id == AudienceSmart.id
    ).join(
        UserIntegration, UserIntegration.id == IntegrationUserSync.integration_id
    ).filter(
        AudienceDataSyncImportedPersons.data_sync_id == data_sync_id,
        AudienceDataSyncImportedPersons.status == DataSyncImportedStatus.SENT.value,
        UserIntegration.service_name == service_name
    ).order_by(EnrichmentUser.id).limit(data_sync_limit)
       
    return query.all()


async def send_leads_to_rmq(session, rmq_connection, encrhment_users, data_sync, user_integrations_service_name):
    encrhment_user_ids = [encrhment_user.id for encrhment_user in encrhment_users]
    arr_enrichment_users = []
    for encrhment_user_id in encrhment_user_ids:
        data_sync_imported_leads = (
            insert(AudienceDataSyncImportedPersons)
            .values(
                status=DataSyncImportedStatus.SENT.value,
                enrichment_user_id=encrhment_user_id,
                service_name=user_integrations_service_name,
                data_sync_id=data_sync.id,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            .returning(AudienceDataSyncImportedPersons.id)
            .on_conflict_do_nothing()
        )
        data_sync_imported_leads = session.execute(data_sync_imported_leads)
        session.commit()
        sync_imported_encrichment_id = data_sync_imported_leads.scalar()
        if not sync_imported_encrichment_id:
            existing_id_query = (
                select(AudienceDataSyncImportedPersons.id)
                .filter_by(enrichment_user_id=encrhment_user_id, data_sync_id=data_sync.id)
                )
            sync_imported_encrichment_id = session.execute(existing_id_query).scalar()
        arr_enrichment_users.append(
            {
                'data_sync_imported_id': str(sync_imported_encrichment_id),
                'enrichment_user_id': str(encrhment_user_id),
            }
        )
    msg = {
        'data_sync_id': data_sync.id,
        'arr_enrichment_users': arr_enrichment_users
    }
    await send_leads_to_queue(rmq_connection, msg)

async def process_user_integrations(rmq_connection, session, subscription_service: SubscriptionService):
    user_integrations, data_syncs = fetch_data_syncs(session)
    for i, data_sync in enumerate(data_syncs):
        if not subscription_service.is_user_has_active_subscription(user_integrations[i].user_id):
            logging.info(f"Skip, subscription is not active for user {user_integrations[i].user_id}")
            continue
        
        if (data_sync.sync_status == False or user_integrations[i].is_failed == True or data_sync.is_active == False):
            logging.info(f"Skip, Integration is failed {user_integrations[i].is_failed}, Data sync status {data_sync.sync_status}")
            continue
        
        imported_count = update_data_sync_integration(session=session, data_sync_id=data_sync.id, data_sync=data_sync, last_sync_date=False)
        
        if (data_sync.sent_contacts - imported_count) == 0:
            logging.info(f"Skip, Integration sent_contacts == imported_count")
            continue
        
        # if user_integrations[i].service_name != 's3' and user_integrations[i].user_id != 681:
        #     continue
        
        limit = user_integrations[i].limit
        
        data_sync_limit = min(limit, data_sync.sent_contacts - imported_count)
        
        encrhment_users = get_previous_imported_encrhment_users(session=session, data_sync_id=data_sync.id, data_sync_limit=data_sync_limit, service_name=user_integrations[i].service_name)
        logging.info(f"Re imported leads= {len(encrhment_users)}")
        if BATCH_SIZE - len(encrhment_users) > 0:
            additional_leads = fetch_enrichment_users_by_data_sync(session=session, data_sync_id=data_sync.id, limit=data_sync_limit - len(encrhment_users), last_sent_enrichment_id=data_sync.last_sent_enrichment_id)
            encrhment_users.extend(additional_leads)

        if not encrhment_users:
            logging.info(f"encrhment_users empty")
            continue
        
        logging.debug(f"encrhment_users len = {len(encrhment_users)}")
        encrhment_users = sorted(encrhment_users, key=lambda x: x.id)
        await send_leads_to_rmq(session, rmq_connection, encrhment_users, data_sync, user_integrations[i].service_name)
        last_encrichment_id = encrhment_users[-1].id
        if last_encrichment_id:
            logging.info(f"last_lead_id = {last_encrichment_id}")
            update_last_sent_encrihment_user(session, data_sync.id, last_encrichment_id)
            update_data_sync_integration(session, data_sync.id, data_sync)
            

async def main():
    log_level = logging.INFO
    if len(sys.argv) > 1:
        arg = sys.argv[1].upper()
        if arg == 'DEBUG':
            log_level = logging.DEBUG
        elif arg == 'INFO':
            log_level = logging.INFO
        else:
            sys.exit("Invalid log level argument. Use 'DEBUG' or 'INFO'.")

    setup_logging(log_level)
    logging.info("Started")
    db_username = os.getenv('DB_USERNAME')
    db_password = os.getenv('DB_PASSWORD')
    db_host = os.getenv('DB_HOST')
    db_name = os.getenv('DB_NAME')

    engine = create_engine(
        f"postgresql://{db_username}:{db_password}@{db_host}/{db_name}", pool_pre_ping=True
    )
    Session = sessionmaker(bind=engine)
    sleep_interval = LONG_SLEEP    
    while True:
        db_session = None
        rabbitmq_connection = None
        try:
            rabbitmq_connection = RabbitMQConnection()
            rmq_connection = await rabbitmq_connection.connect()
            channel = await rmq_connection.channel()
            await channel.set_qos(prefetch_count=1)
            queue = await channel.declare_queue(
                name=AUDIENCE_DATA_SYNC_PERSONS,
                durable=True,
            )
            if queue.declaration_result.message_count == 0:
                db_session = Session()
                subscription_service = SubscriptionService(
                    plans_persistence = PlansPersistence(db_session),
                    user_persistence_service = None,
                    referral_service = None,
                    partners_persistence = None,
                    db=db_session,
                )
                await process_user_integrations(rmq_connection, db_session, subscription_service)
                logging.info("Processing completed. Sleeping for 10 minutes...")
            else:
                sleep_interval = SHORT_SLEEP
                logging.info("Queue is not empty. Skipping processing.")
                
        except Exception as err:
            logging.error('Unhandled Exception:', exc_info=True)
        finally:
            if db_session:
                logging.info("Closing the database session...")
                db_session.close()
            if rabbitmq_connection:
                logging.info("Closing RabbitMQ connection...")
                await rabbitmq_connection.close()
        await asyncio.sleep(sleep_interval)

if __name__ == "__main__":
    asyncio.run(main())
