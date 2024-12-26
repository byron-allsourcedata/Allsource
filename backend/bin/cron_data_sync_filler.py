import asyncio
import logging
import os
import sys
current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from dotenv import load_dotenv
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection
from sqlalchemy import create_engine, asc, select
from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime, timezone
from enums import DataSyncImportedStatus, ProccessDataSyncResult
from utils import get_utc_aware_date
from models.users_domains import UserDomains
from sqlalchemy.dialects.postgresql import insert
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.five_x_five_users import FiveXFiveUser
from models.integrations.users_domains_integrations import UserIntegration
from models.data_sync_imported_leads import DataSyncImportedLeads
from models.leads_users import LeadUser

load_dotenv()

CRON_DATA_SYNC_LEADS = 'cron_data_sync_leads'
BATCH_SIZE = 100
SLEEP_INTERVAL = 6 * 60 * 60

def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

async def send_leads_to_queue(rmq_connection, processed_lead):
    await publish_rabbitmq_message(
        connection=rmq_connection,
        queue_name=CRON_DATA_SYNC_LEADS,
        message_body=processed_lead
    )

def fetch_data_syncs(session):
    results = session.query(UserIntegration, IntegrationUserSync).join(
        IntegrationUserSync, IntegrationUserSync.integration_id == UserIntegration.id
    ).all()
    user_integrations = [res[0] for res in results]
    data_syncs = [res[1] for res in results]

    return user_integrations, data_syncs

def update_data_sync_integration(session, data_sync_id):
    no_of_contacts = session.query(DataSyncImportedLeads).filter(
        DataSyncImportedLeads.status == ProccessDataSyncResult.SUCCESS.value, 
        DataSyncImportedLeads.data_sync_id == data_sync_id
    ).count()
    update_data = {
        'last_sync_date': get_utc_aware_date(),
        'no_of_contacts': no_of_contacts
    }

    session.query(IntegrationUserSync).filter(IntegrationUserSync.id == data_sync_id).update(update_data)
    session.commit()



def fetch_leads_by_domain(session: Session, domain_id: int, limit: int, last_sent_lead_id, data_sync_leads_type):
    if last_sent_lead_id is None:
        last_sent_lead_id = 0
    
    query = session.query(LeadUser.id, LeadUser.behavior_type, FiveXFiveUser.up_id) \
        .join(FiveXFiveUser, FiveXFiveUser.id == LeadUser.five_x_five_user_id) \
        .join(UserDomains, UserDomains.id == LeadUser.domain_id) \
        .filter(LeadUser.domain_id == domain_id, LeadUser.id > last_sent_lead_id, UserDomains.is_enable == True)
        

    if data_sync_leads_type != 'allContacts':
        query = query.filter(LeadUser.behavior_type == data_sync_leads_type)
    
    result = query.limit(limit).all()
    return result or []


def update_last_sent_lead(session, integration_id, last_lead_id):
    session.query(IntegrationUserSync).filter(
        IntegrationUserSync.integration_id == integration_id
    ).update({IntegrationUserSync.last_sent_lead_id: last_lead_id})
    session.commit()
    
def update_data_sync_imported_leads(session, status, data_sync_id):
    session.db.query(DataSyncImportedLeads).filter(DataSyncImportedLeads.id == data_sync_id).update({
            'status': status
            })
    session.db.commit()

def get_previous_imported_leads(session, data_sync_id, data_sync_leads_type):
    query = session.query(
        LeadUser.id,
        LeadUser.behavior_type,
        FiveXFiveUser.up_id
    ).join(
        FiveXFiveUser, FiveXFiveUser.id == LeadUser.five_x_five_user_id
    ).join(
        DataSyncImportedLeads, DataSyncImportedLeads.lead_users_id == LeadUser.id
    ).join(
        UserDomains, UserDomains.id == LeadUser.domain_id
    ).filter(
        DataSyncImportedLeads.data_sync_id == data_sync_id,
        DataSyncImportedLeads.status == DataSyncImportedStatus.SENT.value,
        LeadUser.is_active == True,
        UserDomains.is_enable == True
    )
    
    if data_sync_leads_type != 'allContacts':
        query = query.filter(LeadUser.behavior_type == data_sync_leads_type)
        
    return query.all()


async def send_leads_to_rmq(session, rmq_connection, lead_users, data_sync, integration):
    last_lead_id = None
    for lead in lead_users:
        if integration.service_name != 'klaviyo':
            continue
            
        last_lead_id = lead.id
        data_sync_imported_leads = (
            insert(DataSyncImportedLeads)
            .values(
                status=DataSyncImportedStatus.SENT.value,
                five_x_five_up_id=lead.up_id,
                lead_users_id=lead.id,
                service_name=integration.service_name,
                data_sync_id=data_sync.id,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            .returning(DataSyncImportedLeads.id)
            .on_conflict_do_nothing()
        )

        data_sync_imported_leads = session.execute(data_sync_imported_leads)
        session.commit()
        data_sync_id = data_sync_imported_leads.scalar()
        if not data_sync_id:
            existing_id_query = (
            select(DataSyncImportedLeads.id)
            .filter_by(five_x_five_up_id=lead.up_id, data_sync_id=data_sync.id)
            )
            data_sync_id = session.execute(existing_id_query).scalar()
        
        processed_lead = {
                'data_sync_id': data_sync_id, 
                'lead_users_id': lead.id,
                'five_x_five_up_id': lead.up_id, 
                'service_name': integration.service_name,
                'integration_id': integration.id
                }
        await send_leads_to_queue(rmq_connection, processed_lead)
    if last_lead_id:
        logging.info(f"last_lead_id = {last_lead_id}")
        update_last_sent_lead(session, integration.id, last_lead_id)
        update_data_sync_integration(session, data_sync.id)

async def process_user_integrations(rmq_connection, session):
    user_integrations, data_syncs = fetch_data_syncs(session)
    for i, data_sync in enumerate(data_syncs):
        if data_sync.sync_status == False or user_integrations[i].is_failed == True:
            logging.info(f"Skip, Integration is failed {user_integrations[i].is_failed}, Data sync status {data_sync.sync_status}")
            continue
        
        if data_sync.is_active == False:
            continue
        
        lead_users = get_previous_imported_leads(session, data_sync.id, data_sync.leads_type)
        logging.info(f"lead_users len = {len(lead_users)}")
        if BATCH_SIZE - len(lead_users) > 0:
            logging.info(f"need import len = {BATCH_SIZE - len(lead_users)}")
            additional_leads = fetch_leads_by_domain(session, data_sync.domain_id, BATCH_SIZE - len(lead_users), data_sync.last_sent_lead_id, data_sync.leads_type)
            lead_users.extend(additional_leads)

        if not lead_users:
            logging.info(f"lead_users empty")
            continue
        
        logging.debug(f"lead_users len = {len(lead_users)}")
        lead_users = sorted(lead_users, key=lambda x: x.id)
        await send_leads_to_rmq(session, rmq_connection, lead_users, data_sync, user_integrations[i])
            

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

    db_username = os.getenv('DB_USERNAME')
    db_password = os.getenv('DB_PASSWORD')
    db_host = os.getenv('DB_HOST')
    db_name = os.getenv('DB_NAME')

    engine = create_engine(
        f"postgresql://{db_username}:{db_password}@{db_host}/{db_name}", pool_pre_ping=True
    )
    Session = sessionmaker(bind=engine)

    while True:
        db_session = None
        rabbitmq_connection = None
        try:
            logging.info("Starting processing...")

            rabbitmq_connection = RabbitMQConnection()
            rmq_connection = await rabbitmq_connection.connect()
            channel = await rmq_connection.channel()
            await channel.set_qos(prefetch_count=1)
            await channel.declare_queue(
                name=CRON_DATA_SYNC_LEADS,
                durable=True,
            )
            db_session = Session()

            await process_user_integrations(rmq_connection, db_session)

            logging.info("Processing completed. Sleeping for 6 hours...")
        except Exception as err:
            logging.error('Unhandled Exception:', exc_info=True)
        finally:
            if db_session:
                logging.info("Closing the database session...")
                db_session.close()
            if rabbitmq_connection:
                logging.info("Closing RabbitMQ connection...")
                await rabbitmq_connection.close()
        await asyncio.sleep(SLEEP_INTERVAL)

if __name__ == "__main__":
    asyncio.run(main())
