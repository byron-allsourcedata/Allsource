import logging
import os
import sys
import asyncio
import functools
import json
import sys
current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from uuid import UUID
from sqlalchemy import create_engine
from sqlalchemy.exc import PendingRollbackError
from dotenv import load_dotenv
from models.enrichment.enrichment_users import EnrichmentUser
from utils import get_utc_aware_date
from models.audience_smarts_persons import AudienceSmartPerson
from models.audience_smarts import AudienceSmart
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection
from config.aws import get_s3_client
from enums import ProccessDataSyncResult, DataSyncImportedStatus, SourcePlatformEnum, NotificationTitles, AudienceSmartStatuses
from models.audience_data_sync_imported_persons import AudienceDataSyncImportedPersons
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from models.audience_smarts_validations import AudienceSmartValidation
from sqlalchemy.orm import sessionmaker, Session, selectinload
from aio_pika import IncomingMessage
from config.rmq_connection import RabbitMQConnection
from services.integrations.base import IntegrationService
from services.integrations.million_verifier import MillionVerifierIntegrationsService
from dependencies import (IntegrationsPresistence, LeadsPersistence, AudiencePersistence, 
                          LeadOrdersPersistence, IntegrationsUserSyncPersistence, 
                          AWSService, UserDomainsPersistence, SuppressionPersistence, ExternalAppsInstallationsPersistence, UserPersistence, MillionVerifierPersistence, NotificationPersistence)


load_dotenv()

AUDIENCE_DATA_SYNC_PERSONS = 'audience_data_sync_persons'

for handler in logging.root.handlers[:]:
    logging.root.removeHandler(handler)
    
def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )


def check_correct_data_sync(enrichment_user_id: int, data_sync_imported_id: int, session: Session):
    data_sync_imported_lead = session.query(AudienceDataSyncImportedPersons).filter(AudienceDataSyncImportedPersons.id==data_sync_imported_id).first()
    if not data_sync_imported_lead:
        return False
    
    if data_sync_imported_lead.status != DataSyncImportedStatus.SENT.value:
        return False
    
    if data_sync_imported_lead.enrichment_user_id != UUID(enrichment_user_id):
        return False
    
    return True

def get_lead_attributes(session, enrichment_user_ids, data_sync_id):
    result = session.query(
        EnrichmentUser,
        UserIntegration,
        IntegrationUserSync
    ) \
    .join(AudienceSmartPerson, AudienceSmartPerson.enrichment_user_id == EnrichmentUser.id) \
    .join(AudienceSmart, AudienceSmart.id == AudienceSmartPerson.smart_audience_id) \
    .join(IntegrationUserSync, IntegrationUserSync.smart_audience_id == AudienceSmart.id) \
    .join(UserIntegration, UserIntegration.id == IntegrationUserSync.integration_id)\
    .filter(
        EnrichmentUser.id.in_(enrichment_user_ids),
        IntegrationUserSync.id == data_sync_id
    ) \
    .all()
    if result:
        enrichment_users = [row[0] for row in result]
        user_integration = result[0][1]
        data_sync = result[0][2]
        return enrichment_users, user_integration, data_sync
    else:
        return [], None, None


def update_users_integrations(session, status, integration_data_sync_id, service_name, user_domain_integration_id = None, smart_audience_id=None):
    if status == ProccessDataSyncResult.LIST_NOT_EXISTS.value:
        logging.info(f"List not exists for  integration_data_sync_id {integration_data_sync_id}")
        session.query(IntegrationUserSync).filter(IntegrationUserSync.id == integration_data_sync_id).update({
            'sync_status': False
            })
        session.commit()
        
    if status == ProccessDataSyncResult.AUTHENTICATION_FAILED.value or ProccessDataSyncResult.PAYMENT_REQUIRED.value:
        logging.info(f"Authentication failed for  user_domain_integration_id {user_domain_integration_id}")
        subquery = (
            session.query(AudienceSmart.id)
            .join(IntegrationUserSync, IntegrationUserSync.smart_audience_id == AudienceSmart.id)
            .filter(IntegrationUserSync.id == integration_data_sync_id)
            .subquery()
        )
        session.query(AudienceSmart)\
            .filter(AudienceSmart.id.in_(subquery))\
            .update({AudienceSmart.status: AudienceSmartStatuses.FAILED.value}, synchronize_session=False)

        
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
        
def update_data_sync_imported_leads(session, status: str, integration_data_sync: IntegrationUserSync, user_integration: UserIntegration, enrichment_user_ids):
    session.query(AudienceDataSyncImportedPersons)\
        .filter(AudienceDataSyncImportedPersons.enrichment_user_id.in_(enrichment_user_ids))\
        .update({'status': status}, synchronize_session=False)

    session.flush()

        
    integration_data_sync.last_sync_date = get_utc_aware_date()
    if integration_data_sync.sync_status == False:
        integration_data_sync.sync_status = True
        
    if user_integration.is_failed == True:
        user_integration.is_failed = False
        user_integration.error_message = None
        
    session.commit()
    
async def send_error_msg(user_id: int, service_name: str, notification_persistence: NotificationPersistence, title: str):
    account_notification = notification_persistence.get_account_notification_by_title(title)
    notification = notification_persistence.find_account_notifications(user_id=user_id, account_notification_id=account_notification.id)
    if notification:
        return
    
    rabbitmq_connection = RabbitMQConnection()
    connection = await rabbitmq_connection.connect()
    queue_name = f"sse_events_{str(user_id)}"
    notification_text = account_notification.text.format(service_name)
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
        data_sync_id = message_body['data_sync_id']
        enrichment_user_ids = []

        for enrichment_users in message_body.get('arr_enrichment_users'):
            enrichment_user_id = enrichment_users.get('enrichment_user_id')
            enrichment_user_ids.append(enrichment_user_id)

            if not check_correct_data_sync(enrichment_user_id, enrichment_users['data_sync_imported_id'], session):
                logging.debug(f"Data sync not correct for user {enrichment_user_id}")
                continue
            
        if not enrichment_user_ids:
            logging.warning(f"Data sync not correct")
            await message.ack()
            return

        logging.info(f"Data sync id: {data_sync_id}")
        logging.info(f"Lead Users count: {len(enrichment_user_ids)}")
        
        enrichment_users, user_integration, integration_data_sync = get_lead_attributes(
            session, enrichment_user_ids, data_sync_id
        )
        if not user_integration or not integration_data_sync:
            logging.warning(f"Data sync not correct")
            await message.ack()
            return
        
        service_map = {
            'meta': integration_service.meta,
            'google_ads': integration_service.google_ads,
            'hubspot': integration_service.hubspot,
            's3': integration_service.s3,
            'sales_force': integration_service.sales_force,
            'mailchimp': integration_service.mailchimp
        }
        service_name = user_integration.service_name
        service = service_map.get(service_name)
        
        if service:
            result = None
            try:
                result = await service.process_data_sync(user_integration, integration_data_sync, enrichment_users)
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
                                        
                case ProccessDataSyncResult.SUCCESS.value:
                    logging.debug(f"success: {service_name}")
                    import_status = DataSyncImportedStatus.SUCCESS.value
                    
                case ProccessDataSyncResult.LIST_NOT_EXISTS.value:
                    logging.debug(f"list_not_exists: {service_name}")
                    update_users_integrations(session=session, status=ProccessDataSyncResult.LIST_NOT_EXISTS.value, integration_data_sync_id=integration_data_sync.id, service_name=service_name)
                    await send_error_msg(user_integration.user_id, service_name, notification_persistence, NotificationTitles.DATA_SYNC_ERROR.value)
                    
                case ProccessDataSyncResult.AUTHENTICATION_FAILED.value:
                    logging.debug(f"authentication_failed: {service_name}")
                    update_users_integrations(session, ProccessDataSyncResult.AUTHENTICATION_FAILED.value, integration_data_sync.id, service_name, integration_data_sync.integration_id)
                    await send_error_msg(user_integration.user_id, service_name, notification_persistence, NotificationTitles.AUTHENTICATION_INTEGRATION_FAILED.value)
                
                case ProccessDataSyncResult.PAYMENT_REQUIRED.value:
                    logging.debug(f"payment_required: {service_name}")
                    update_users_integrations(session, ProccessDataSyncResult.PAYMENT_REQUIRED.value, integration_data_sync.id, service_name, integration_data_sync.integration_id)
                    await send_error_msg(user_integration.user_id, service_name, notification_persistence, NotificationTitles.PAYMENT_INTEGRATION_REQUIRED.value)
                
            if import_status != DataSyncImportedStatus.SENT.value:
                update_data_sync_imported_leads(session=session, status=import_status, integration_data_sync=integration_data_sync, user_integration=user_integration, enrichment_user_ids=enrichment_user_ids)
                
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
            name=AUDIENCE_DATA_SYNC_PERSONS,
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
