import asyncio
import logging
import os
import sys
current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection
from sqlalchemy import create_engine
from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime, timezone
from enums import DataSyncImportedStatus, ProccessDataSyncResult
from utils import get_utc_aware_date
from models.enrichment_users import EnrichmentUser
from models.audience_smarts_persons import AudienceSmartPerson
from models.audience_smarts import AudienceSmart
from models.users_domains import UserDomains
from sqlalchemy.dialects.postgresql import insert
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from models.data_sync_imported_enrichment import DataSyncImportedEncrichment
from models.leads_users import LeadUser

load_dotenv()

CRON_DATA_SYNC_LEADS = 'cron_data_sync_leads_test'
BATCH_SIZE = 200
LONG_SLEEP = 60 * 10
SHORT_SLEEP = 10

def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

async def send_leads_to_queue(rmq_connection, msg):
    import json
    message_str = json.dumps(msg)
    await publish_rabbitmq_message(
        connection=rmq_connection,
        queue_name=CRON_DATA_SYNC_LEADS,
        message_body=message_str
    )

def fetch_data_syncs(session):
    results = session.query(UserIntegration, IntegrationUserSync)\
            .join(IntegrationUserSync, IntegrationUserSync.integration_id == UserIntegration.id)\
            .all()
    user_integrations = [res[0] for res in results]
    data_syncs = [res[1] for res in results]

    return user_integrations, data_syncs

def update_data_sync_integration(session, data_sync_id):
    no_of_contacts = session.query(DataSyncImportedEncrichment).filter(
        DataSyncImportedEncrichment.status == ProccessDataSyncResult.SUCCESS.value, 
        DataSyncImportedEncrichment.data_sync_id == data_sync_id
    ).count()
    update_data = {
        'last_sync_date': get_utc_aware_date(),
        'no_of_contacts': no_of_contacts
    }

    session.query(IntegrationUserSync).filter(IntegrationUserSync.id == data_sync_id).update(update_data)
    session.commit()

def fetch_encrihment_users_by_data_sync(session: Session, data_sync_id, limit, last_sent_lead_id):
    if last_sent_lead_id is None:
        last_sent_lead_id = 0

    query = session.query(EnrichmentUser.id) \
        .join(AudienceSmartPerson, AudienceSmartPerson.enrichment_user_id == EnrichmentUser.id) \
        .join(AudienceSmart, AudienceSmart.id == AudienceSmartPerson.smart_audience_id) \
        .join(IntegrationUserSync, IntegrationUserSync.smart_audience_id == AudienceSmart.id) \
        .filter(
            IntegrationUserSync.id == data_sync_id
        )
   
    result = query.order_by(LeadUser.id).limit(limit).all()
    return result or []

def update_last_sent_encrihment_user(session, data_sync_id, last_encrichment_id):
    session.query(IntegrationUserSync).filter(
        IntegrationUserSync.id == data_sync_id
    ).update({IntegrationUserSync.last_sent_encrichment_id: last_encrichment_id})
    session.commit()
    
def update_data_sync_imported_leads(session, status, data_sync_id):
    session.db.query(DataSyncImportedEncrichment).filter(DataSyncImportedEncrichment.id == data_sync_id).update({
            'status': status
            })
    session.db.commit()

def get_previous_imported_encrhment_users(session, data_sync_id):
    query = session.query(
        EnrichmentUser.id,
    ).join(
        AudienceSmartPerson, AudienceSmartPerson.enrichment_user_id == EnrichmentUser.id
    ).join(
        DataSyncImportedEncrichment, DataSyncImportedEncrichment.enrichment_user_id == EnrichmentUser.id
    ).join(
        AudienceSmart, AudienceSmart.id == AudienceSmartPerson.smart_audience_id
    ).filter(
        DataSyncImportedEncrichment.data_sync_id == data_sync_id,
        DataSyncImportedEncrichment.status == DataSyncImportedStatus.SENT.value,
        UserDomains.is_enable == True
    )
       
    return query.all()


async def send_leads_to_rmq(session, rmq_connection, encrhment_users, data_sync, user_integrations_service_name):
    encrhment_user_ids = [encrhment_user.id for encrhment_user in encrhment_users]
    arr_enrichment_users = []
    for encrhment_user_id in encrhment_user_ids:
        data_sync_imported_leads = (
            insert(DataSyncImportedEncrichment)
            .values(
                status=DataSyncImportedStatus.SENT.value,
                enrichment_user_id=encrhment_user_id,
                service_name=user_integrations_service_name,
                data_sync_id=data_sync.id,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            .returning(DataSyncImportedEncrichment.id)
            .on_conflict_do_nothing()
        )
        data_sync_imported_leads = session.execute(data_sync_imported_leads)
        session.commit()
        sync_imported_encrichment_id = data_sync_imported_leads.scalar()
        arr_enrichment_users.append(
            {
                'data_sync_imported_id': sync_imported_encrichment_id,
                'enrichment_user_id': encrhment_user_id,
            }
        )
    msg = {
        'data_sync_id': data_sync.id,
        'arr_enrichment_users': arr_enrichment_users
    }
    await send_leads_to_queue(rmq_connection, msg)

async def process_user_integrations(rmq_connection, session):
    user_integrations, data_syncs = fetch_data_syncs(session)
    for i, data_sync in enumerate(data_syncs):
        if (data_sync.sync_status == False or user_integrations[i].is_failed == True or data_sync.is_active == False):
            logging.info(f"Skip, Integration is failed {user_integrations[i].is_failed}, Data sync status {data_sync.sync_status}")
            continue
        
        encrhment_users = get_previous_imported_encrhment_users(session, data_sync.id)
        logging.info(f"Re imported leads= {len(encrhment_users)}")
        if BATCH_SIZE - len(encrhment_users) > 0:
            additional_leads = fetch_encrihment_users_by_data_sync(session, data_sync.id, BATCH_SIZE - len(encrhment_users), data_sync.last_sent_lead_id)
            encrhment_users.extend(additional_leads)

        update_data_sync_integration(session, data_sync.id)
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
        update_data_sync_integration(session, data_sync.id)
            

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
                name=CRON_DATA_SYNC_LEADS,
                durable=True,
            )
            if queue.declaration_result.message_count == 0:
                db_session = Session()
                await process_user_integrations(rmq_connection, db_session)
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
