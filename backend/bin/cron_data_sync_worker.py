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

from clickhouse_connect.driver import AsyncClient
from sqlalchemy import Row, update
from typing import List, Tuple, Dict

from domains.leads.entities import DelivrUser, LeadUserAdapter as LeadUser
from persistence.delivr.leads_users_ch_repo import LeadsUsersCHRepository
from persistence.delivr.delivr_users_ch_repo import DelivrUsersCHRepository

from models import UserDomains
from persistence.delivr.client import AsyncDelivrClickHouseClient

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
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from models.five_x_five_users import FiveXFiveUser
from sqlalchemy.orm import Session
from aio_pika import IncomingMessage
from config.rmq_connection import RabbitMQConnection
from services.integrations.base import IntegrationService
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
    pixel_sync_id: int, pixel_sync_imported_ids: list[int], session: Session
) -> tuple[Any, list[Row[tuple[Any]]], list[Row[tuple[Any]]]] | None:
    """Validate integration/sync and fetch imported rows split by PG and CH.
    Returns: (integration_data, pg_rows, ch_rows)
    """
    integration_data = (
        session.query(UserIntegration, IntegrationUserSync)
        .join(
            IntegrationUserSync,
            IntegrationUserSync.integration_id == UserIntegration.id,
        )
        .filter(
            IntegrationUserSync.id == pixel_sync_id,
            IntegrationUserSync.sync_status != False,
        )
        .first()
    )

    if not integration_data:
        logging.info("Pixel sync not found or Sync status is False")
        return None

    pg_rows = (
        session.query(DataSyncImportedLead.lead_users_id.label("lead_users_id"))
        .filter(
            DataSyncImportedLead.id.in_(pixel_sync_imported_ids),
            DataSyncImportedLead.status == DataSyncImportedStatus.SENT.value,
            DataSyncImportedLead.lead_users_id.isnot(None),
        )
        .all()
    )
    ch_rows = (
        session.query(DataSyncImportedLead.ch_lead_id.label("ch_lead_id"))
        .filter(
            DataSyncImportedLead.id.in_(pixel_sync_imported_ids),
            DataSyncImportedLead.status == DataSyncImportedStatus.SENT.value,
            DataSyncImportedLead.ch_lead_id.isnot(None),
        )
        .all()
    )
    return integration_data, pg_rows, ch_rows


def get_domain_is_email_validation_enabled(
    domain_id: int, session: Session
) -> bool:
    """
    Returns is_email_validation_enabled flag for domain_id.
    If domain does not exist — returns False.
    """

    if not domain_id:
        return False

    result = (
        session.query(UserDomains.is_email_validation_enabled)
        .filter(UserDomains.id == domain_id)
        .first()
    )

    return bool(result[0]) if result else False


def _first_or_none(arr) -> str | None:
    if not arr:
        return None
    try:
        return arr[0]
    except Exception:
        return None


def _join_list(arr) -> str | None:
    if not arr:
        return None
    try:
        vals = [str(x) for x in arr if x]
        return ", ".join(vals) if vals else None
    except Exception:
        return None


async def get_lead_attributes_clickhouse(
    ch_client: AsyncClient, ch_lead_ids: List[str]
) -> List[Tuple[LeadUser, DelivrUser]]:
    if not ch_lead_ids:
        return []
    # Wrap repos
    ch = AsyncDelivrClickHouseClient()
    ch._client = ch_client  # reuse existing connection
    leads_repo = LeadsUsersCHRepository(ch)
    delivr_repo = DelivrUsersCHRepository(ch)

    # 1) id -> profile_pid_all, first_visit_id
    id_map = await leads_repo.fetch_by_ids(ch_lead_ids)
    if not id_map:
        return []

    profile_pids = [
        r["profile_pid_all"]
        for r in id_map.values()
        if r.get("profile_pid_all")
    ]

    # 2) fetch delivr details by profile_pid_all
    delivr_map = await delivr_repo.fetch_by_profile_pids(profile_pids)

    results: List[Tuple[LeadUser, DelivrUser]] = []
    for ch_id in ch_lead_ids:
        meta = id_map.get(str(ch_id))
        if not meta:
            continue
        pid = meta.get("profile_pid_all")
        d = delivr_map.get(pid, {})

        fu = DelivrUser(
            first_name=str(d.get("first_name")).capitalize(),
            last_name=str(d.get("last_name")).capitalize(),
            business_email=_first_or_none(d.get("business_emails")),
            business_email_last_seen=_first_or_none(
                d.get("business_email_last_seen")
            ),
            programmatic_business_emails=_join_list(d.get("business_emails")),
            mobile_phone=_first_or_none(d.get("mobile_phones")),
            direct_number=_first_or_none(d.get("direct_numbers")),
            personal_phone=_first_or_none(d.get("personal_phones")),
            linkedin_url=d.get("linkedin_url"),
            personal_address=d.get("personal_address"),
            personal_address_2=d.get("personal_address_2"),
            personal_city=d.get("personal_city"),
            personal_state=d.get("personal_state"),
            personal_zip=d.get("personal_zip"),
            personal_emails=_join_list(d.get("personal_emails")),
            gender=d.get("gender"),
            children=d.get("has_children"),
            income_range=d.get("income_range_lc"),
            net_worth=d.get("net_worth"),
            homeowner=d.get("is_homeowner"),
            job_title=d.get("job_title"),
            seniority_level=d.get("seniority_level"),
            department=d.get("department"),
            company_name=d.get("company_name"),
            company_domain=d.get("company_domain"),
            company_phone=_join_list(d.get("company_phones")),
            company_sic=_join_list(d.get("company_sic")),
            company_address=d.get("company_address"),
            company_city=d.get("company_city"),
            company_state=d.get("company_state"),
            company_zip=d.get("company_zip"),
            company_linkedin_url=d.get("company_linkedin_url"),
            company_revenue=str(d.get("company_total_revenue"))
            if d.get("company_total_revenue") is not None
            else None,
            company_employee_count=d.get("company_employee_count"),
            primary_industry=d.get("company_industry"),
        )
        lu = LeadUser(
            id=ch_id,
            first_visit_id=str(meta.get("first_visit_id"))
            if meta.get("first_visit_id")
            else None,
        )
        results.append((lu, fu))
    return results


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


def bulk_update_imported_leads_ch(
    session: Session,
    updates: list[dict],
    integration_data_sync: IntegrationUserSync,
    user_integration: UserIntegration,
):
    """Bulk status update for ClickHouse-sourced records by ch_lead_id."""
    for update_item in updates:
        stmt = (
            update(DataSyncImportedLead)
            .where(
                DataSyncImportedLead.ch_lead_id == update_item["lead_id"],
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
    ch_client: AsyncClient,
    notification_persistence: NotificationPersistence,
):
    try:
        message_body = json.loads(message.body)
        service_name = message_body.get("service_name")
        data_sync_imported_ids = message_body.get("data_sync_imported_ids")
        data_sync_id = message_body.get("data_sync_id")
        users_id = message_body.get("users_id")
        logging.info(f"Data sync id {data_sync_id}")
        check_data = check_correct_data_sync(
            pixel_sync_id=data_sync_id,
            pixel_sync_imported_ids=data_sync_imported_ids,
            session=db_session,
        )
        if not check_data:
            await message.ack()
            return
        integration_data, pg_rows, ch_rows = check_data

        if not pg_rows and not ch_rows:
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
        # Build PG and CH id lists
        pg_lead_user_ids = [row.lead_users_id for row in pg_rows]
        ch_lead_ids = [str(row.ch_lead_id) for row in ch_rows]

        service = service_map.get(service_name)
        # ClickHouse leads
        leads_ch = await get_lead_attributes_clickhouse(ch_client, ch_lead_ids)
        # Combine preserving PG first, then CH (order inside each preserved)
        leads = []
        if leads_ch:
            leads.extend(leads_ch)

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

                    case ProccessDataSyncResult.ERROR_CREATE_CUSTOM_VARIABLES.value:
                        logging.debug(
                            f"Custom variables don't created: {service_name}"
                        )
                        update_users_integrations(
                            db_session,
                            status=ProccessDataSyncResult.ERROR_CREATE_CUSTOM_VARIABLES.value,
                            integration_data_sync_id=data_sync.id,
                            service_name=service_name,
                        )
                        await send_error_msg(
                            user_integration.user_id,
                            service_name,
                            notification_persistence,
                            NotificationTitles.DATA_SYNC_ERROR.value,
                        )
                        await message.ack()
                        return

            # Split updates into PG vs CH buckets based on id membership
            updates_pg = []
            updates_ch = []
            pg_id_set = (
                set(int(x) for x in pg_lead_user_ids)
                if pg_lead_user_ids
                else set()
            )
            ch_id_set = (
                set(str(x) for x in ch_lead_ids) if ch_lead_ids else set()
            )
            for r in results:
                lead_id_val = r.get("lead_id")
                if lead_id_val is None:
                    continue
                if isinstance(lead_id_val, int) and lead_id_val in pg_id_set:
                    updates_pg.append(
                        {"lead_id": lead_id_val, "status": r["status"]}
                    )
                else:
                    lead_id_str = str(lead_id_val)
                    if lead_id_str in ch_id_set:
                        updates_ch.append(
                            {"lead_id": lead_id_str, "status": r["status"]}
                        )
                    elif lead_id_val in pg_id_set:
                        updates_pg.append(
                            {"lead_id": lead_id_val, "status": r["status"]}
                        )
                    else:
                        # Unknown id; skip with debug
                        logging.debug(
                            f"Skip update for unknown lead_id={lead_id_val}"
                        )

            if updates_pg:
                bulk_update_imported_leads(
                    session=db_session,
                    updates=updates_pg,
                    integration_data_sync=data_sync,
                    user_integration=user_integration,
                )
            if updates_ch:
                bulk_update_imported_leads_ch(
                    session=db_session,
                    updates=updates_ch,
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
        ch = await AsyncDelivrClickHouseClient().connect()
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
            with integration_service as int_service:
                await queue.consume(
                    functools.partial(
                        ensure_integration,
                        integration_service=int_service,
                        db_session=db_session,
                        ch_client=ch,
                        notification_persistence=notification_persistence,
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
