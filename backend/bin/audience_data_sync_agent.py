import asyncio
import functools
import json
import logging
import os
import sys
import time
import uuid
from collections import Counter
from datetime import datetime, timezone
from typing import List

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from persistence.audience_quota import AudienceQuotaPersistence
from config.sentry import SentryConfig
from uuid import UUID
from resolver import Resolver
from sqlalchemy import select, update
from sqlalchemy.exc import PendingRollbackError, SQLAlchemyError
from dotenv import load_dotenv
from models import Users
from models.enrichment.enrichment_users import EnrichmentUser
from utils import get_utc_aware_date
from models.enrichment.enrichment_professional_profiles import (
    EnrichmentProfessionalProfile,
)
from models.enrichment.enrichment_user_contact import EnrichmentUserContact
from models.enrichment.enrichment_personal_profiles import (
    EnrichmentPersonalProfiles,
)
from models.enrichment.enrichment_postals import EnrichmentPostal
from models.audience_smarts import AudienceSmart
from config.rmq_connection import (
    publish_rabbitmq_message_with_channel,
)
from enums import (
    ProccessDataSyncResult,
    DataSyncImportedStatus,
    SourcePlatformEnum,
    NotificationTitles,
    AudienceSmartStatuses,
)
from models.audience_data_sync_imported_persons import (
    AudienceDataSyncImportedPersons,
)
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from sqlalchemy.orm import Session
from aio_pika import IncomingMessage
from config.rmq_connection import RabbitMQConnection
from services.integrations.base import IntegrationService
from db_dependencies import Db, Clickhouse
from dependencies import (
    NotificationPersistence,
)


load_dotenv()

AUDIENCE_DATA_SYNC_PERSONS = "audience_data_sync_persons"

for handler in logging.root.handlers[:]:
    logging.root.removeHandler(handler)


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def check_correct_data_sync(
    enrichment_user_asid: str, data_sync_imported_id: int, session: Session
):
    data_sync_imported_lead = (
        session.query(AudienceDataSyncImportedPersons)
        .filter(AudienceDataSyncImportedPersons.id == data_sync_imported_id)
        .first()
    )
    if not data_sync_imported_lead:
        return False

    if data_sync_imported_lead.status != DataSyncImportedStatus.SENT.value:
        return False

    if data_sync_imported_lead.enrichment_user_asid != UUID(
        enrichment_user_asid
    ):
        return False

    return True


def get_enrichment_users_from_clickhouse(
    ch_client: Clickhouse,
    enrichment_user_asids: list[str],
) -> list[EnrichmentUser]:
    if not enrichment_user_asids:
        return []

    asids_str = ", ".join(f"'{asid}'" for asid in enrichment_user_asids)
    query = f"""
        SELECT *
        FROM enrichment_users
        WHERE asid IN ({asids_str})
    """
    result = ch_client.query(query)
    columns = result.column_names

    enrichment_users = []
    for row in result.result_rows:
        row_dict = dict(zip(columns, row))

        enrichment_user = EnrichmentUser(
            asid=row_dict["asid"],
        )

        # Связь: contacts
        enrichment_user.contacts = EnrichmentUserContact(
            asid=row_dict["asid"],
            up_id=row_dict.get("up_id"),
            rsid=row_dict.get("rsid"),
            name_prefix=row_dict.get("name_prefix"),
            first_name=row_dict.get("first_name"),
            middle_name=row_dict.get("middle_name"),
            last_name=row_dict.get("last_name"),
            name_suffix=row_dict.get("name_suffix"),
            business_email=row_dict.get("business_email"),
            personal_email=row_dict.get("personal_email"),
            other_emails=row_dict.get("other_emails"),
            phone_mobile1=row_dict.get("phone_mobile1"),
            phone_mobile2=row_dict.get("phone_mobile2"),
            business_email_last_seen_date=row_dict.get(
                "business_email_last_seen_date"
            ),
            personal_email_last_seen=row_dict.get("personal_email_last_seen"),
            mobile_phone_dnc=row_dict.get("mobile_phone_dnc"),
            business_email_validation_status=row_dict.get(
                "business_email_validation_status"
            ),
            personal_email_validation_status=row_dict.get(
                "personal_email_validation_status"
            ),
            linkedin_url=row_dict.get("linkedin_url"),
            email=row_dict.get("email"),
        )

        # Связь: personal_profiles
        enrichment_user.personal_profiles = EnrichmentPersonalProfiles(
            asid=row_dict["asid"],
            age=row_dict.get("age"),
            gender=row_dict.get("gender"),
            homeowner=row_dict.get("homeowner"),
            length_of_residence_years=row_dict.get("length_of_residence_years"),
            marital_status=row_dict.get("marital_status"),
            business_owner=row_dict.get("business_owner"),
            birth_day=row_dict.get("birth_day"),
            birth_month=row_dict.get("birth_month"),
            birth_year=row_dict.get("birth_year"),
            has_children=row_dict.get("has_children"),
            number_of_children=row_dict.get("number_of_children"),
            religion=row_dict.get("religion"),
            ethnicity=row_dict.get("ethnicity"),
            language_code=row_dict.get("language_code"),
            state_abbr=row_dict.get("state_abbr"),
            zip_code5=row_dict.get("zip_code5"),
        )

        # Связь: professional_profiles
        enrichment_user.professional_profiles = EnrichmentProfessionalProfile(
            asid=row_dict["asid"],
            current_job_title=row_dict.get("current_job_title"),
            current_company_name=row_dict.get("current_company_name"),
            job_start_date=row_dict.get("job_start_date"),
            job_duration=row_dict.get("job_duration"),
            job_location=row_dict.get("job_location"),
            job_level=row_dict.get("job_level"),
            department=row_dict.get("department"),
            company_size=row_dict.get("company_size"),
            primary_industry=row_dict.get("primary_industry"),
            annual_sales=row_dict.get("annual_sales"),
        )

        # Связь: postal
        enrichment_user.postal = EnrichmentPostal(
            asid=row_dict["asid"],
            home_address_line1=row_dict.get("home_address_line_1"),
            home_address_line2=row_dict.get("home_address_line_2"),
            home_city=row_dict.get("home_city"),
            home_state=row_dict.get("home_state"),
            home_postal_code=row_dict.get("home_postal_code"),
            home_country=row_dict.get("home_country"),
            home_address_last_seen=row_dict.get("home_address_last_seen"),
            home_address_validation_status=row_dict.get(
                "home_address_validation_status"
            ),
            business_address_line1=row_dict.get("business_address_line_1"),
            business_address_line2=row_dict.get("business_address_line_2"),
            business_city=row_dict.get("business_city"),
            business_state=row_dict.get("business_state"),
            business_postal_code=row_dict.get("business_postal_code"),
            business_country=row_dict.get("business_country"),
            business_address_last_seen=row_dict.get(
                "business_address_last_seen"
            ),
            business_address_validation_status=row_dict.get(
                "business_address_validation_status"
            ),
            address_source=row_dict.get("address_source"),
            raw_url_date=row_dict.get("raw_url_date"),
            raw_last_updated=row_dict.get("raw_last_updated"),
            created_date=row_dict.get("created_date"),
        )

        enrichment_users.append(enrichment_user)

    return enrichment_users


def get_lead_attributes_from_ch(
    pg_session,
    ch_client: Clickhouse,
    enrichment_user_asids: list[str],
    data_sync_id: int,
):
    result = (
        pg_session.query(
            UserIntegration,
            IntegrationUserSync,
            AudienceSmart.target_schema,
            AudienceSmart.validations,
        )
        .join(
            IntegrationUserSync,
            IntegrationUserSync.integration_id == UserIntegration.id,
        )
        .join(
            AudienceSmart,
            AudienceSmart.id == IntegrationUserSync.smart_audience_id,
        )
        .filter(IntegrationUserSync.id == data_sync_id)
        .first()
    )

    if not result:
        return [], None, None, None, None

    user_integration, data_sync, target_schema, validations = result

    enrichment_users = get_enrichment_users_from_clickhouse(
        ch_client, enrichment_user_asids
    )

    return (
        enrichment_users,
        user_integration,
        data_sync,
        target_schema,
        validations,
    )


def update_users_integrations(
    session,
    status,
    integration_data_sync_id,
    service_name,
    user_domain_integration_id=None,
    smart_audience_id=None,
):
    if status == ProccessDataSyncResult.LIST_NOT_EXISTS.value:
        logging.info(
            f"List not exists for  integration_data_sync_id {integration_data_sync_id}"
        )
        session.query(IntegrationUserSync).filter(
            IntegrationUserSync.id == integration_data_sync_id
        ).update({"sync_status": False})
        session.commit()

    if (
        status == ProccessDataSyncResult.AUTHENTICATION_FAILED.value
        or ProccessDataSyncResult.PAYMENT_REQUIRED.value
    ):
        logging.info(
            f"Authentication failed for  user_domain_integration_id {user_domain_integration_id}"
        )

        subquery = (
            select(AudienceSmart.id)
            .join(
                IntegrationUserSync,
                IntegrationUserSync.smart_audience_id == AudienceSmart.id,
            )
            .filter(IntegrationUserSync.id == integration_data_sync_id)
        )

        session.query(AudienceSmart).filter(
            AudienceSmart.id.in_(subquery)
        ).update(
            {AudienceSmart.status: AudienceSmartStatuses.FAILED.value},
            synchronize_session=False,
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


def bulk_update_data_sync_imported_leads(
    session: Session,
    updates: List[dict],
    integration_data_sync: IntegrationUserSync,
    user_integration: UserIntegration,
):
    for u in updates:
        stmt = (
            update(AudienceDataSyncImportedPersons)
            .where(
                AudienceDataSyncImportedPersons.enrichment_user_asid
                == u["enrichment_user_asid"],
                AudienceDataSyncImportedPersons.data_sync_id
                == integration_data_sync.id,
            )
            .values(
                status=u["status"],
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
    account_notification = (
        notification_persistence.get_account_notification_by_title(title)
    )
    notification = notification_persistence.find_account_notifications(
        user_id=user_id, account_notification_id=account_notification.id
    )
    if notification:
        return

    rabbitmq_connection = RabbitMQConnection()
    rmq_connection = await rabbitmq_connection.connect()
    channel = await rmq_connection.channel()
    queue_name = f"sse_events_{str(user_id)}"
    notification_text = account_notification.text.format(service_name)
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
    pg_session: Db,
    ch_session: Clickhouse,
    notification_persistence: NotificationPersistence,
    audience_quotas: AudienceQuotaPersistence,
):
    try:
        message_body = json.loads(message.body)
        data_sync_id = message_body["data_sync_id"]
        enrichment_user_asids = []

        for enrichment_users in message_body.get("arr_enrichment_users"):
            enrichment_user_asid = enrichment_users.get("enrichment_user_asid")
            enrichment_user_asids.append(enrichment_user_asid)

            if not check_correct_data_sync(
                enrichment_user_asid,
                enrichment_users["data_sync_imported_id"],
                pg_session,
            ):
                logging.debug(
                    f"Data sync not correct for user {enrichment_user_asid}"
                )
                continue

        if not enrichment_user_asids:
            logging.warning(f"Data sync not correct")
            await message.ack()
            return

        logging.info(f"Data sync id: {data_sync_id}")
        logging.info(f"Lead Users count: {len(enrichment_user_asids)}")

        (
            enrichment_users,
            user_integration,
            integration_data_sync,
            target_schema,
            validations,
        ) = get_lead_attributes_from_ch(
            pg_session, ch_session, enrichment_user_asids, data_sync_id
        )
        if not user_integration or not integration_data_sync:
            logging.warning(f"Data sync not correct")
            await message.ack()
            return

        service_name = user_integration.service_name
        user_id = user_integration.user_id

        service_map = {
            "meta": integration_service.meta,
            "google_ads": integration_service.google_ads,
            "hubspot": integration_service.hubspot,
            "s3": integration_service.s3,
            "sales_force": integration_service.sales_force,
            "mailchimp": integration_service.mailchimp,
            "go_high_level": integration_service.go_high_level,
        }

        service = service_map.get(service_name)
        user_quota = audience_quotas.by_user_id(user_id)
        if user_quota is None:
            user_quota = -1

        is_unlimited = user_quota == -1

        if service:
            try:
                if validations:
                    validations = json.loads(validations)

                if not is_unlimited and user_quota <= 0:
                    logging.info(f"User #{user_id} has 0 quota, skipping")
                    await message.ack()
                    return

                if user_quota > 0 and len(enrichment_users) > user_quota:
                    logging.info(
                        f"User {user_id} quota={user_quota}, "
                        + f"truncating {len(enrichment_users)}→{user_quota}"
                    )
                    enrichment_users = enrichment_users[:user_quota]

                results = await service.process_data_sync(
                    user_integration,
                    integration_data_sync,
                    enrichment_users,
                    target_schema,
                    validations,
                )
                status_counts = Counter(r.get("status") for r in results)
                logging.info(f"Status summary: {dict(status_counts)}")
            except BaseException as e:
                logging.error(f"Error processing data sync: {e}", exc_info=True)
                await message.ack()
                raise

            for result in results:
                match result["status"]:
                    case ProccessDataSyncResult.INCORRECT_FORMAT.value:
                        logging.debug(f"incorrect_format: {service_name}")

                    case ProccessDataSyncResult.SUCCESS.value:
                        logging.debug(f"success: {service_name}")

                    case ProccessDataSyncResult.LIST_NOT_EXISTS.value:
                        logging.debug(f"list_not_exists: {service_name}")
                        update_users_integrations(
                            session=pg_session,
                            status=ProccessDataSyncResult.LIST_NOT_EXISTS.value,
                            integration_data_sync_id=integration_data_sync.id,
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

                    case ProccessDataSyncResult.AUTHENTICATION_FAILED.value:
                        logging.debug(f"authentication_failed: {service_name}")
                        update_users_integrations(
                            pg_session,
                            ProccessDataSyncResult.AUTHENTICATION_FAILED.value,
                            integration_data_sync.id,
                            service_name,
                            integration_data_sync.integration_id,
                        )
                        await send_error_msg(
                            user_integration.user_id,
                            service_name,
                            notification_persistence,
                            NotificationTitles.AUTHENTICATION_INTEGRATION_FAILED.value,
                        )
                        await message.ack()
                        return

                    case ProccessDataSyncResult.PAYMENT_REQUIRED.value:
                        logging.debug(f"payment_required: {service_name}")
                        update_users_integrations(
                            pg_session,
                            ProccessDataSyncResult.PAYMENT_REQUIRED.value,
                            integration_data_sync.id,
                            service_name,
                            integration_data_sync.integration_id,
                        )
                        await send_error_msg(
                            user_integration.user_id,
                            service_name,
                            notification_persistence,
                            NotificationTitles.PAYMENT_INTEGRATION_REQUIRED.value,
                        )
                        await message.ack()
                        return

                    case ProccessDataSyncResult.QUOTA_EXHAUSTED.value:
                        logging.debug(f"Quota exhausted: {service_name}")
                        update_users_integrations(
                            session=pg_session,
                            status=ProccessDataSyncResult.QUOTA_EXHAUSTED.value,
                            integration_data_sync_id=integration_data_sync.id,
                            service_name=service_name,
                            user_domain_integration_id=integration_data_sync.integration_id,
                        )
                        await send_error_msg(
                            user_integration.user_id,
                            service_name,
                            notification_persistence,
                            NotificationTitles.QUOTA_EXHAUSTED.value,
                        )
                        await message.ack()
                        return

            bulk_update_data_sync_imported_leads(
                session=pg_session,
                updates=[
                    {
                        "enrichment_user_asid": r["enrichment_user_asid"],
                        "status": r["status"],
                    }
                    for r in results
                ],
                integration_data_sync=integration_data_sync,
                user_integration=user_integration,
            )

            # Deduct successful leads in short FOR UPDATE transaction
            successful = sum(
                1
                for r in results
                if r["status"] == ProccessDataSyncResult.SUCCESS.value
            )
            if successful > 0:
                try:
                    with pg_session.begin():
                        new_quota = audience_quotas.deduct(user_id, successful)
                    logging.info(
                        f"Deducted {successful} credits from user {user_id}; "
                        + f"new quota={new_quota}"
                    )
                except SQLAlchemyError as e:
                    logging.error(f"Quota deduction failed: {e}", exc_info=True)

            logging.info(f"Processed message for service: {service_name}")
            await message.ack()
            return

    except PendingRollbackError:
        logging.error("PendingRollbackError occurred, rolling back session.")
        pg_session.rollback()
        await asyncio.sleep(5)
        await message.reject(requeue=True)

    except Exception as e:
        logging.error(f"Error processing message {e}", exc_info=True)
        pg_session.rollback()
        await asyncio.sleep(5)
        await message.reject(requeue=True)


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
        try:
            rabbitmq_connection = RabbitMQConnection()
            connection = await rabbitmq_connection.connect()
            channel = await connection.channel()
            await channel.set_qos(prefetch_count=1)

            queue = await channel.declare_queue(
                name=AUDIENCE_DATA_SYNC_PERSONS,
                durable=True,
            )
            db_session = await resolver.resolve(Db)
            ch_client = await resolver.resolve(Clickhouse)
            notification_persistence = await resolver.resolve(
                NotificationPersistence
            )
            audience_quotas = await resolver.resolve(AudienceQuotaPersistence)
            integration_service = await resolver.resolve(IntegrationService)
            async with integration_service as service:
                await queue.consume(
                    functools.partial(
                        ensure_integration,
                        integration_service=service,
                        pg_session=db_session,
                        ch_session=ch_client,
                        notification_persistence=notification_persistence,
                        audience_quotas=audience_quotas,
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
