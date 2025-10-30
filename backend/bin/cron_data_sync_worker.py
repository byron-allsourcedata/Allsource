import asyncio
import functools
import json
import logging
import os
import sys
import time
from collections import Counter
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Row, update

from models import UserDomains

# from pprint import pprint

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from services.exceptions import InsufficientCreditsError, MillionVerifierError
from resolver import Resolver
from config.sentry import SentryConfig
from sqlalchemy.exc import PendingRollbackError
from dotenv import load_dotenv
from utils import get_utc_aware_date
from config.rmq_connection import publish_rabbitmq_message_with_channel
from enums import (
    ProccessDataSyncResult,
    DataSyncImportedStatus,
    SourcePlatformEnum,
    NotificationTitles,
)
from models.data_sync_imported_leads import DataSyncImportedLead
from models.leads_users import LeadUser
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from models.five_x_five_users import FiveXFiveUser
from sqlalchemy.orm import Session
from aio_pika import IncomingMessage
from config.rmq_connection import RabbitMQConnection
from services.integrations.base import IntegrationService
from persistence.user_persistence import UserPersistence
from db_dependencies import Db
from dependencies import (
    NotificationPersistence,
)

load_dotenv()

CRON_DATA_SYNC_LEADS = "cron_data_sync_leads"

for handler in logging.root.handlers[:]:
    logging.root.removeHandler(handler)


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def check_correct_data_sync(
    data_sync_id: int, data_sync_imported_ids: list[int], session: Session
) -> tuple[Any, list[Row[tuple[Any]]]] | None:
    integration_data = (
        session.query(UserIntegration, IntegrationUserSync)
        .join(
            IntegrationUserSync,
            IntegrationUserSync.integration_id == UserIntegration.id,
        )
        .filter(
            IntegrationUserSync.id == data_sync_id,
            IntegrationUserSync.sync_status != False,
        )
        .first()
    )

    if not integration_data:
        logging.info("Data sync not found or Sync status is False")
        return None

    result = (
        session.query(DataSyncImportedLead.lead_users_id.label("lead_users_id"))
        .filter(
            DataSyncImportedLead.id.in_(data_sync_imported_ids),
            DataSyncImportedLead.status == DataSyncImportedStatus.SENT.value,
        )
        .all()
    )
    return integration_data, result


def get_domain_is_email_validation_enabled(
    domain_id: int, session: Session
) -> bool:
    """
    Returns is_email_validation_enabled flag for domain_id.
    If domain does not exist — returns False.
    """

    if not domain_id:
        return False  # Безопасно возвращаем False

    result = (
        session.query(UserDomains.is_email_validation_enabled)
        .filter(UserDomains.id == domain_id)
        .first()
    )

    return bool(result[0]) if result else False


def get_lead_attributes(session, lead_user_ids):
    five_x_five_users = (
        session.query(LeadUser, FiveXFiveUser)
        .join(LeadUser, LeadUser.five_x_five_user_id == FiveXFiveUser.id)
        .filter(LeadUser.id.in_(lead_user_ids))
        .all()
    )
    if five_x_five_users:
        leads = five_x_five_users
        return leads
    else:
        return None


def update_users_integrations(
    session,
    status,
    integration_data_sync_id,
    service_name,
    user_domain_integration_id=None,
):
    if status in (
        ProccessDataSyncResult.LIST_NOT_EXISTS.value,
        ProccessDataSyncResult.QUOTA_EXHAUSTED.value,
        ProccessDataSyncResult.PAYMENT_REQUIRED.value,
    ):
        session.query(IntegrationUserSync).filter(
            IntegrationUserSync.id == integration_data_sync_id
        ).update({"sync_status": False})
        session.commit()

    if status == ProccessDataSyncResult.AUTHENTICATION_FAILED.value:
        logging.info(
            f"Authentication failed for  user_domain_integration_id {user_domain_integration_id}"
        )
        if service_name == SourcePlatformEnum.WEBHOOK.value:
            session.query(IntegrationUserSync).filter(
                IntegrationUserSync.id == integration_data_sync_id
            ).update(
                {
                    "sync_status": False,
                }
            )
        else:
            session.query(UserIntegration).filter(
                UserIntegration.id == user_domain_integration_id
            ).update({"is_failed": True, "error_message": status})

            session.query(IntegrationUserSync).filter(
                IntegrationUserSync.integration_id == user_domain_integration_id
            ).update(
                {
                    "sync_status": False,
                }
            )
        session.commit()


def bulk_update_imported_leads(
    session: Session,
    updates: list[dict],
    integration_data_sync: IntegrationUserSync,
    user_integration: UserIntegration,
):
    for update_item in updates:
        stmt = (
            update(DataSyncImportedLead)
            .where(
                DataSyncImportedLead.lead_users_id == update_item["lead_id"],
                DataSyncImportedLead.data_sync_id == integration_data_sync.id,
            )
            .values(
                status=update_item["status"],
                updated_at=datetime.now(timezone.utc).replace(tzinfo=None),
            )
        )
        session.execute(stmt)

    has_success = any(
        u["status"] == ProccessDataSyncResult.SUCCESS.value for u in updates
    )

    if has_success:
        integration_data_sync.last_sync_date = get_utc_aware_date()
        if not integration_data_sync.sync_status:
            integration_data_sync.sync_status = True

        if user_integration.is_failed:
            user_integration.is_failed = False
            user_integration.error_message = None

    session.commit()


async def send_error_msg(
    user_id: int,
    service_name: str,
    notification_persistence: NotificationPersistence,
    title: str,
):
    rabbitmq_connection = RabbitMQConnection()
    connection = await rabbitmq_connection.connect()
    channel = await connection.channel()
    queue_name = f"sse_events_{str(user_id)}"
    account_notification = (
        notification_persistence.get_account_notification_by_title(title)
    )
    notification_text = account_notification.text.format(service_name)
    notification = notification_persistence.find_account_notifications(
        user_id=user_id, account_notification_id=account_notification.id
    )
    if not notification:
        save_account_notification = (
            notification_persistence.save_account_notification(
                user_id=user_id,
                account_notification_id=account_notification.id,
                params=service_name,
            )
        )
        try:
            await publish_rabbitmq_message_with_channel(
                channel=channel,
                queue_name=queue_name,
                message_body={
                    "notification_text": notification_text,
                    "notification_id": save_account_notification.id,
                },
            )
        except:
            logging.error("Failed to publish rabbitmq message")
        finally:
            await rabbitmq_connection.close()


async def ensure_integration(
    message: IncomingMessage,
    integration_service: IntegrationService,
    db_session: Db,
    notification_persistence: NotificationPersistence,
    user_persistence: UserPersistence,
):
    try:
        message_body = json.loads(message.body)
        service_name = message_body.get("service_name")
        data_sync_imported_ids = message_body.get("data_sync_imported_ids")
        data_sync_id = message_body.get("data_sync_id")
        users_id = message_body.get("users_id")
        logging.info(f"Data sync id {data_sync_id}")
        check_data = check_correct_data_sync(
            data_sync_id,
            data_sync_imported_ids=data_sync_imported_ids,
            session=db_session,
        )
        if not check_data:
            await message.ack()
            return
        integration_data, lead_user_data = check_data

        if not lead_user_data:
            logging.info(f"data sync empty for {data_sync_id}")
            await message.ack()
            return

        user_integration = integration_data[0]
        data_sync = integration_data[1]
        service_map = {
            "klaviyo": integration_service.klaviyo,
            "meta": integration_service.meta,
            "omnisend": integration_service.omnisend,
            "mailchimp": integration_service.mailchimp,
            "sendlane": integration_service.sendlane,
            "zapier": integration_service.zapier,
            "slack": integration_service.slack,
            "google_ads": integration_service.google_ads,
            "webhook": integration_service.webhook,
            "hubspot": integration_service.hubspot,
            "sales_force": integration_service.sales_force,
            "s3": integration_service.s3,
            "go_high_level": integration_service.go_high_level,
            "customer_io": integration_service.customer_io,
            "instantly": integration_service.instantly,
            "green_arrow": integration_service.green_arrow,
        }
        lead_user_ids = [t.lead_users_id for t in lead_user_data]
        service = service_map.get(service_name)
        leads = get_lead_attributes(db_session, lead_user_ids)
        is_email_validation_enabled = get_domain_is_email_validation_enabled(
            domain_id=data_sync.domain_id, session=db_session
        )
        if service:
            try:
                results = await service.process_data_sync_lead(
                    user_integration,
                    data_sync,
                    leads,
                    is_email_validation_enabled,
                )

                status_counts = Counter(r.get("status") for r in results)
                logging.info(f"Status summary: {dict(status_counts)}")

            except MillionVerifierError as e:
                logging.error(
                    f"MillionVerifierError while processing data sync: {e}",
                    exc_info=True,
                )
                await message.ack()
                return

            except InsufficientCreditsError as e:
                logging.error(
                    f"InsufficientCreditsError while processing data sync: {e}"
                )
                await message.ack()
                return

            except BaseException as e:
                logging.error(f"Error processing data sync: {e}", exc_info=True)
                await message.ack()
                return

            for result in results:
                match result["status"]:
                    case ProccessDataSyncResult.INCORRECT_FORMAT.value:
                        logging.debug(f"incorrect_format: {service_name}")

                    case (
                        ProccessDataSyncResult.PLATFORM_VALIDATION_FAILED.value
                    ):
                        logging.debug(
                            f"Platform validation failed: {service_name}"
                        )

                    case ProccessDataSyncResult.VERIFY_EMAIL_FAILED.value:
                        logging.debug(f"incorrect_format: {service_name}")

                    case ProccessDataSyncResult.SUCCESS.value:
                        logging.debug(f"success: {service_name}")

                    case ProccessDataSyncResult.LIST_NOT_EXISTS.value:
                        logging.debug(f"list_not_exists: {service_name}")
                        update_users_integrations(
                            session=db_session,
                            status=ProccessDataSyncResult.LIST_NOT_EXISTS.value,
                            integration_data_sync_id=data_sync.id,
                            service_name=service_name,
                        )
                        await send_error_msg(
                            users_id,
                            service_name,
                            notification_persistence,
                            NotificationTitles.DATA_SYNC_ERROR.value,
                        )
                        await message.ack()
                        return

                    case ProccessDataSyncResult.TOO_MANY_REQUESTS.value:
                        logging.debug(f"too_many_requests: {service_name}")

                    case ProccessDataSyncResult.UNEXPECTED_ERROR.value:
                        logging.debug(f"Unexpected error: {service_name}")

                    case ProccessDataSyncResult.QUOTA_EXHAUSTED.value:
                        logging.debug(f"Quota exhausted: {service_name}")
                        update_users_integrations(
                            session=db_session,
                            status=ProccessDataSyncResult.QUOTA_EXHAUSTED.value,
                            integration_data_sync_id=data_sync.id,
                            service_name=service_name,
                        )
                        await send_error_msg(
                            users_id,
                            service_name,
                            notification_persistence,
                            NotificationTitles.QUOTA_EXHAUSTED.value,
                        )
                        await message.ack()
                        return

                    case ProccessDataSyncResult.PAYMENT_REQUIRED.value:
                        logging.debug(f"Quota exhausted: {service_name}")
                        update_users_integrations(
                            session=db_session,
                            status=ProccessDataSyncResult.PAYMENT_REQUIRED.value,
                            integration_data_sync_id=data_sync.id,
                            service_name=service_name,
                        )
                        await send_error_msg(
                            users_id,
                            service_name,
                            notification_persistence,
                            NotificationTitles.PAYMENT_REQUIRED.value,
                        )
                        await message.ack()
                        return

                    case ProccessDataSyncResult.AUTHENTICATION_FAILED.value:
                        logging.debug(f"authentication_failed: {service_name}")
                        update_users_integrations(
                            db_session,
                            ProccessDataSyncResult.AUTHENTICATION_FAILED.value,
                            data_sync.id,
                            service_name,
                            data_sync.integration_id,
                        )
                        await send_error_msg(
                            users_id,
                            service_name,
                            notification_persistence,
                            NotificationTitles.AUTHENTICATION_INTEGRATION_FAILED.value,
                        )
                        await message.ack()
                        return

            bulk_update_imported_leads(
                session=db_session,
                updates=[
                    {"lead_id": r["lead_id"], "status": r["status"]}
                    for r in results
                ],
                integration_data_sync=data_sync,
                user_integration=user_integration,
            )

            logging.info(f"Processed message for service: {service_name}")
            await message.ack()
            return
        else:
            logging.error(f"Invalid service name: {service_name}")
            await message.reject(requeue=True)
            return

    except PendingRollbackError:
        logging.error("PendingRollbackError occurred, rolling back session.")
        db_session.rollback()
        await asyncio.sleep(5)
        await message.reject(requeue=True)

    except Exception as e:
        logging.error(f"Error processing message {e}", exc_info=True)
        await message.ack()
        await asyncio.sleep(5)


async def main():
    await SentryConfig.async_initilize()
    log_level = logging.INFO
    if len(sys.argv) > 1:
        arg = sys.argv[1].upper()
        if arg == "DEBUG":
            log_level = logging.DEBUG
        elif arg != "INFO":
            sys.exit("Invalid log level argument. Use 'DEBUG' or 'INFO'.")

    setup_logging(log_level)
    resolver = Resolver()
    while True:
        rabbitmq_connection = None
        db_session = None  # ✅ объявляем до try
        integration_service = None
        try:
            rabbitmq_connection = RabbitMQConnection()
            connection = await rabbitmq_connection.connect()
            channel = await connection.channel()
            await channel.set_qos(prefetch_count=1)

            queue = await channel.declare_queue(
                name=CRON_DATA_SYNC_LEADS,
                durable=True,
            )
            db_session = await resolver.resolve(Db)
            integration_service = await resolver.resolve(IntegrationService)
            notification_persistence = await resolver.resolve(
                NotificationPersistence
            )
            user_persistence = await resolver.resolve(UserPersistence)
            with integration_service as int_service:
                await queue.consume(
                    functools.partial(
                        ensure_integration,
                        integration_service=int_service,
                        db_session=db_session,
                        notification_persistence=notification_persistence,
                        user_persistence=user_persistence,
                    )
                )
                await asyncio.Future()

        except BaseException as e:
            logging.error("Unhandled Exception:", exc_info=True)
            SentryConfig.capture(e)
        finally:
            if db_session:
                logging.info("Closing the database session...")
                db_session.close()
            if rabbitmq_connection:
                logging.info("Closing RabbitMQ connection...")
                await rabbitmq_connection.close()
            logging.info("Shutting down...")
            time.sleep(10)


if __name__ == "__main__":
    asyncio.run(main())
