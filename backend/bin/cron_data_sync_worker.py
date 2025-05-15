import logging
import os
import sys
import asyncio
import functools
import json
import requests
import os
import sys
current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from sqlalchemy import create_engine, or_
from sqlalchemy.exc import PendingRollbackError
from dotenv import load_dotenv
from utils import get_utc_aware_date
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection
from config.aws import get_s3_client
from enums import ProccessDataSyncResult, DataSyncImportedStatus, SourcePlatformEnum, NotificationTitles
from models.data_sync_imported_leads import DataSyncImportedLeads
from models.leads_users import LeadUser
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from models.five_x_five_users import FiveXFiveUser
from sqlalchemy.orm import sessionmaker, Session
from aio_pika import IncomingMessage
from config.rmq_connection import RabbitMQConnection
from services.integrations.base import IntegrationService
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from dependencies import (IntegrationsPresistence, LeadsPersistence, AudiencePersistence, 
                          LeadOrdersPersistence, IntegrationsUserSyncPersistence, 
                          AWSService, UserDomainsPersistence, SuppressionPersistence, ExternalAppsInstallationsPersistence, UserPersistence, MillionVerifierPersistence, NotificationPersistence)


load_dotenv()

CRON_DATA_SYNC_LEADS = 'cron_data_sync_leads'

for handler in logging.root.handlers[:]:
    logging.root.removeHandler(handler)
    
def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )


def check_correct_data_sync(five_x_five_up_id: str, lead_users_id: int, data_sync_imported_id: int, session: Session):
    data_sync_imported_lead = session.query(DataSyncImportedLeads).filter(DataSyncImportedLeads.id==data_sync_imported_id).first()
    if not data_sync_imported_lead:
        return False
    
    if data_sync_imported_lead.status != DataSyncImportedStatus.SENT.value:
        return False
    
    if data_sync_imported_lead.five_x_five_up_id != five_x_five_up_id or data_sync_imported_lead.lead_users_id != lead_users_id:
        return False
    
    return True

def get_lead_attributes(session, lead_users_id, data_sync_id):
    result = session.query(
        LeadUser, 
        FiveXFiveUser, 
        UserIntegration, 
        IntegrationUserSync
    ) \
    .join(FiveXFiveUser, FiveXFiveUser.id == LeadUser.five_x_five_user_id) \
    .join(UserIntegration, 
          or_(UserIntegration.user_id == LeadUser.user_id, 
              UserIntegration.domain_id == LeadUser.domain_id))\
    .join(IntegrationUserSync, IntegrationUserSync.integration_id == UserIntegration.id) \
    .filter(LeadUser.id == lead_users_id, 
            IntegrationUserSync.id == data_sync_id) \
    .first()

    if result:
        lead, five_x_five_user, user_integration, data_sync = result
        return lead, five_x_five_user, user_integration, data_sync
    else:
        return None, None, None, None

def update_users_integrations(session, status, integration_data_sync_id, service_name, user_domain_integration_id = None):
    if status == ProccessDataSyncResult.LIST_NOT_EXISTS.value:
        logging.info(f"List not exists for  integration_data_sync_id {integration_data_sync_id}")
        session.query(IntegrationUserSync).filter(IntegrationUserSync.id == integration_data_sync_id).update({
            'sync_status': False
            })
        session.commit()
        
    if status == ProccessDataSyncResult.TOO_MANY_REQUESTS.value:
        session.query(IntegrationUserSync).filter(IntegrationUserSync.id == integration_data_sync_id).update({
            'sync_status': False
            })
        session.commit()
        
    if status == ProccessDataSyncResult.QUOTA_EXHAUSTED.value:
        session.query(IntegrationUserSync).filter(IntegrationUserSync.id == integration_data_sync_id).update({
            'sync_status': False
            })
        session.commit()
        
    if status == ProccessDataSyncResult.AUTHENTICATION_FAILED.value:
        logging.info(f"Authentication failed for  user_domain_integration_id {user_domain_integration_id}")
        if service_name == SourcePlatformEnum.WEBHOOK.value:
            session.query(IntegrationUserSync).filter(IntegrationUserSync.id == integration_data_sync_id).update({
                'sync_status': False,
                })
        else:
            session.query(UserIntegration).filter(UserIntegration.id == user_domain_integration_id).update({
                'is_failed': True,
                'error_message': status
                })
            
            session.query(IntegrationUserSync).filter(IntegrationUserSync.integration_id == user_domain_integration_id).update({
                'sync_status': False,
                })
        session.commit()
        
def update_data_sync_imported_leads(session, status, data_sync_imported_id, integration_data_sync: IntegrationUserSync, user_integration: UserIntegration):
    session.query(DataSyncImportedLeads).filter(DataSyncImportedLeads.id == data_sync_imported_id).update({
            'status': status
            })
    session.flush()
    if status == ProccessDataSyncResult.SUCCESS.value:
        integration_data_sync.last_sync_date = get_utc_aware_date()
        if integration_data_sync.sync_status == False:
            integration_data_sync.sync_status = True
            
        if user_integration.is_failed == True:
            user_integration.is_failed = False
            user_integration.error_message = None
        
    session.commit()
    
async def send_error_msg(user_id: int, service_name: str, notification_persistence: NotificationPersistence, title: str):
    rabbitmq_connection = RabbitMQConnection()
    connection = await rabbitmq_connection.connect()
    queue_name = f"sse_events_{str(user_id)}"
    account_notification = notification_persistence.get_account_notification_by_title(title)
    notification_text = account_notification.text.format(service_name)
    notification = notification_persistence.find_account_with_notification(user_id=user_id, account_notification_id=account_notification.id)
    if not notification:
        save_account_notification = notification_persistence.save_account_notification(user_id=user_id, account_notification_id=account_notification.id, params=service_name)
        try:
            await publish_rabbitmq_message(
                connection=connection,
                queue_name=queue_name,
                message_body={'notification_text': notification_text, 'notification_id': save_account_notification.id}
            )
        except:
            logging.error('Failed to publish rabbitmq message')
        finally:
            await rabbitmq_connection.close()

async def ensure_integration(message: IncomingMessage, integration_service: IntegrationService, session: Session, notification_persistence: NotificationPersistence):
    try:
        message_body = json.loads(message.body)
        service_name = message_body.get('service_name')
        five_x_five_up_id = message_body.get('five_x_five_up_id')
        lead_users_id = message_body.get('lead_users_id')
        data_sync_imported_id = message_body.get('data_sync_imported_id')
        data_sync_id = message_body.get('data_sync_id')
        logging.info(f"Data sync id {data_sync_id}")
        logging.info(f"Lead User id {lead_users_id}")
        if not check_correct_data_sync(five_x_five_up_id, lead_users_id, data_sync_imported_id, session):
            logging.warning(f"Data sync not correct")
            await message.ack()
            return
        
        service_map = {
            'klaviyo': integration_service.klaviyo,
            'meta': integration_service.meta,
            'omnisend': integration_service.omnisend,
            'mailchimp': integration_service.mailchimp,
            'sendlane': integration_service.sendlane,
            'zapier': integration_service.zapier,
            'slack': integration_service.slack,
            'google_ads': integration_service.google_ads,
            'webhook': integration_service.webhook,
            'hubspot': integration_service.hubspot,
            'sales_force': integration_service.sales_force,
            's3': integration_service.s3
        }
        service = service_map.get(service_name)
        lead_user, five_x_five_user, user_integration, integration_data_sync = get_lead_attributes(session, lead_users_id, data_sync_id)
        if service:
            result = None
            try:
                result = await service.process_data_sync(five_x_five_user, user_integration, integration_data_sync, lead_user)
                logging.info(f"Result {result}")
            except BaseException as e:
                logging.error(f"Error processing data sync: {e}", exc_info=True)
                await message.ack()
                raise

            import_status = DataSyncImportedStatus.SENT.value
            match result:
                case ProccessDataSyncResult.INCORRECT_FORMAT.value:
                    logging.debug(f"incorrect_format: {service_name}")
                    import_status = DataSyncImportedStatus.INCORRECT_FORMAT.value
                    
                case ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value:
                    logging.debug(f"incorrect_format: {service_name}")
                    import_status = DataSyncImportedStatus.VERIFY_EMAIL_FAILED.value
                    
                case ProccessDataSyncResult.SUCCESS.value:
                    logging.debug(f"success: {service_name}")
                    import_status = DataSyncImportedStatus.SUCCESS.value
                    
                case ProccessDataSyncResult.LIST_NOT_EXISTS.value:
                    logging.debug(f"list_not_exists: {service_name}")
                    update_users_integrations(session=session, status=ProccessDataSyncResult.LIST_NOT_EXISTS.value, integration_data_sync_id=integration_data_sync.id, service_name=service_name)
                    await send_error_msg(lead_user.user_id, service_name, notification_persistence, NotificationTitles.DATA_SYNC_ERROR.value)
                    
                case ProccessDataSyncResult.LIST_NOT_EXISTS.value:
                    logging.debug(f"too_many_requests: {service_name}")
                    update_users_integrations(session=session, status=ProccessDataSyncResult.TOO_MANY_REQUESTS.value, integration_data_sync_id=integration_data_sync.id, service_name=service_name)
                    await send_error_msg(lead_user.user_id, service_name, notification_persistence, NotificationTitles.TOO_MANY_REQUESTS.value)
                
                case ProccessDataSyncResult.QUOTA_EXHAUSTED.value:
                    logging.debug(f"Quota exhausted: {service_name}")
                    update_users_integrations(session=session, status=ProccessDataSyncResult.QUOTA_EXHAUSTED.value, integration_data_sync_id=integration_data_sync.id, service_name=service_name)
                    await send_error_msg(lead_user.user_id, service_name, notification_persistence, NotificationTitles.QUOTA_EXHAUSTED.value)
                    
                case ProccessDataSyncResult.AUTHENTICATION_FAILED.value:
                    logging.debug(f"authentication_failed: {service_name}")
                    update_users_integrations(session, ProccessDataSyncResult.AUTHENTICATION_FAILED.value, integration_data_sync.id, service_name, integration_data_sync.integration_id)
                    await send_error_msg(lead_user.user_id, service_name, notification_persistence, NotificationTitles.AUTHENTICATION_INTEGRATION_FAILED.value)
                
            if import_status != DataSyncImportedStatus.SENT.value:
                update_data_sync_imported_leads(session, import_status, data_sync_imported_id, integration_data_sync, user_integration)
                
            logging.info(f"Processed message for service: {service_name}")
            await message.ack()
            return
        else:
            logging.error(f"Invalid service name: {service_name}")
            await message.reject(requeue=True)
            return

    except PendingRollbackError:
        logging.error("PendingRollbackError occurred, rolling back session.")
        session.rollback()
        await asyncio.sleep(5)
        await message.reject(requeue=True)

    except Exception as e:
        logging.error(f"Error processing message {e}", exc_info=True)
        session.rollback()
        await asyncio.sleep(5)
        await message.reject(requeue=True)
    
async def main():    
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
            name=CRON_DATA_SYNC_LEADS,
            durable=True,
        )
        engine = create_engine(
            f"postgresql://{db_username}:{db_password}@{db_host}/{db_name}", pool_pre_ping=True
        )
        Session = sessionmaker(bind=engine)
        session = Session()
        million_verifier_persistence = MillionVerifierPersistence(session)
        notification_persistence = NotificationPersistence(session)
        integration_service = IntegrationService(
            db=session,
            integration_persistence=IntegrationsPresistence(session),
            lead_persistence=LeadsPersistence(session),
            audience_persistence=AudiencePersistence(session),
            lead_orders_persistence=LeadOrdersPersistence(session),
            integrations_user_sync_persistence=IntegrationsUserSyncPersistence(session),
            aws_service=AWSService(get_s3_client()),
            domain_persistence=UserDomainsPersistence(session),
            suppression_persistence=SuppressionPersistence(session),
            epi_persistence=ExternalAppsInstallationsPersistence(session),
            user_persistence=UserPersistence(session),
            million_verifier_integrations=MillionVerifierIntegrationsService(million_verifier_persistence)
        )
        with integration_service as service:
            await queue.consume(
                functools.partial(ensure_integration, integration_service=service, session=session, notification_persistence=notification_persistence)
            )
            await asyncio.Future()

    except BaseException as e:
        logging.error('Unhandled Exception:', exc_info=True)

    finally:
        if session:
            logging.info("Closing the database session...")
            session.close()
        if rabbitmq_connection:
            logging.info("Closing RabbitMQ connection...")
            await rabbitmq_connection.close()
        logging.info("Shutting down...")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
