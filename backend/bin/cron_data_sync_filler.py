import asyncio
import logging
import os
import sys
current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from dotenv import load_dotenv
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection
from sqlalchemy import create_engine, asc
from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker
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

async def send_leads_to_queue(rmq_connection, leads_batch):
    await publish_rabbitmq_message(
        connection=rmq_connection,
        queue_name=CRON_DATA_SYNC_LEADS,
        message_body={'users_domains_integration': [lead.to_dict() for lead in leads_batch]}
    )

def fetch_users_integrations(session):
    return session.query(UserIntegration).all()

def fetch_leads_by_domain(session, domain_id, limit):
    return (
        session.query(LeadUser)
        .filter(LeadUser.domain_id == domain_id)
        .order_by(asc(LeadUser.id))
        .limit(limit)
        .all()
    )

def fetch_five_x_five_user(session, user_id):
    return session.query(FiveXFiveUser).filter(FiveXFiveUser.id == user_id).first()

def update_last_sent_lead(session, integration_id, last_lead_id):
    session.query(IntegrationUserSync).filter(
        IntegrationUserSync.integration_id == integration_id
    ).update({IntegrationUserSync.last_sent_lead_id: last_lead_id})
    session.commit()

def get_lead_user_from_integration_user_sync(session, integration_id):
    return session.query(DataSyncImportedLeads).filter(DataSyncImportedLeads.integration_id == integration_id, DataSyncImportedLeads.message != 'incorrect_format').all()

async def process_user_integrations(rmq_connection, session):
    user_integrations = fetch_users_integrations(session)

    for integration in user_integrations:
        lead_users = get_lead_user_from_integration_user_sync(session, integration.id)
        additional_leads = fetch_leads_by_domain(session, integration.domain_id)[:BATCH_SIZE - len(lead_users)]
        lead_users.extend(additional_leads)

        if not lead_users:
            continue

        processed_leads = []

        for lead in lead_users:
            five_x_five_user = fetch_five_x_five_user(session, lead.five_x_five_user_id)

            if not five_x_five_user:
                continue

            lead_request = (
                insert(DataSyncImportedLeads)
                .values(
                    status='sent',
                    access_token=integration.token,
                    five_x_five_up_id=five_x_five_user.up_id,
                    service_name=integration.service_name,
                    integration_id=integration.id,
                )
                .returning(DataSyncImportedLeads.id)
                .on_conflict_do_nothing()
            )

            result = session.execute(lead_request)
            session.commit()
            lead_id = result.scalar()

            if lead_id:
                processed_leads.append({'id': lead_id, 'lead_request': lead_request})

        if processed_leads:
            processed_leads.sort(key=lambda x: x['id'])
            update_last_sent_lead(session, integration.id, processed_leads[-1]['id'])
            await send_leads_to_queue(rmq_connection, processed_leads)
            

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
