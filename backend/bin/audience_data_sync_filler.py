import asyncio
import logging
import os
import sys

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from config.sentry import SentryConfig
from resolver import Resolver
from config.rmq_connection import (
    publish_rabbitmq_message_with_channel,
    RabbitMQConnection,
)
from sqlalchemy import select
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from enums import (
    DataSyncImportedStatus,
    AudienceSmartStatuses,
    DataSyncType,
)
from utils import get_utc_aware_date
from typing import Optional
from uuid import UUID
from models.audience_smarts_persons import AudienceSmartPerson
from models.audience_smarts import AudienceSmart
from sqlalchemy.dialects.postgresql import insert
from services.subscriptions import SubscriptionService
from models.users import Users
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from models.audience_data_sync_imported_persons import (
    AudienceDataSyncImportedPersons,
)
from db_dependencies import Db, Clickhouse

load_dotenv()

AUDIENCE_DATA_SYNC_PERSONS = "audience_data_sync_persons"
LONG_SLEEP = 60
SHORT_SLEEP = 10


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


async def send_leads_to_queue(channel, msg):
    await publish_rabbitmq_message_with_channel(
        channel=channel,
        queue_name=AUDIENCE_DATA_SYNC_PERSONS,
        message_body=msg,
    )


def fetch_data_syncs(session):
    results = (
        session.query(UserIntegration, IntegrationUserSync)
        .join(
            IntegrationUserSync,
            IntegrationUserSync.integration_id == UserIntegration.id,
        )
        .filter(IntegrationUserSync.sent_contacts > 0)
        .all()
    )

    user_integrations = [res[0] for res in results]
    data_syncs = [res[1] for res in results]

    return user_integrations, data_syncs


def get_no_of_imported_success_contacts(session, data_sync_id):
    return (
        session.query(AudienceDataSyncImportedPersons)
        .filter(
            AudienceDataSyncImportedPersons.status
            == DataSyncImportedStatus.SUCCESS.value,
            AudienceDataSyncImportedPersons.data_sync_id == data_sync_id,
        )
        .count()
    )


def get_no_of_imported_contacts(session, data_sync_id):
    return (
        session.query(AudienceDataSyncImportedPersons)
        .filter(
            AudienceDataSyncImportedPersons.status
            != DataSyncImportedStatus.SENT.value,
            AudienceDataSyncImportedPersons.data_sync_id == data_sync_id,
        )
        .count()
    )


def update_data_sync_integration(
    session, data_sync_id, data_sync: IntegrationUserSync, last_sync_date=True
):
    no_of_success_contacts = get_no_of_imported_success_contacts(
        session=session, data_sync_id=data_sync_id
    )
    no_of_contacts = get_no_of_imported_contacts(
        session=session, data_sync_id=data_sync_id
    )
    update_data = {"no_of_contacts": no_of_success_contacts}
    if last_sync_date:
        update_data["last_sync_date"] = get_utc_aware_date()

    session.query(IntegrationUserSync).filter(
        IntegrationUserSync.id == data_sync_id
    ).update(update_data)
    session.flush()

    if no_of_contacts == data_sync.sent_contacts:
        session.query(AudienceSmart).filter(
            AudienceSmart.id == data_sync.smart_audience_id
        ).update(
            {AudienceSmart.status: AudienceSmartStatuses.SYNCED.value},
            synchronize_session=False,
        )

    session.commit()
    return no_of_contacts


def get_enrichment_user_ids_from_pg(
    db_session: Session,
    data_sync_id: int,
    limit: int,
    last_sent_enrichment_id: Optional[UUID] = None,
) -> list[dict[str, str]]:
    query = (
        db_session.query(AudienceSmartPerson.enrichment_user_asid)
        .join(
            AudienceSmart,
            AudienceSmart.id == AudienceSmartPerson.smart_audience_id,
        )
        .join(
            IntegrationUserSync,
            IntegrationUserSync.smart_audience_id == AudienceSmart.id,
        )
        .filter(
            IntegrationUserSync.id == data_sync_id,
            IntegrationUserSync.sync_type == DataSyncType.AUDIENCE.value,
            AudienceSmartPerson.is_valid.is_(True),
        )
    )

    if last_sent_enrichment_id:
        query = query.filter(
            AudienceSmartPerson.enrichment_user_asid > last_sent_enrichment_id
        )

    enrichment_user_ids = query.limit(limit).all()
    return [
        {"asid": str(row.enrichment_user_asid)}
        for row in enrichment_user_ids
        if row.enrichment_user_asid
    ]


def update_last_sent_enrichment_user(
    session, data_sync_id, last_encrichment_id
):
    session.query(IntegrationUserSync).filter(
        IntegrationUserSync.id == data_sync_id
    ).update({IntegrationUserSync.last_sent_enrichment_id: last_encrichment_id})
    session.commit()


def update_data_sync_imported_leads(session, status, data_sync_id):
    session.db.query(AudienceDataSyncImportedPersons).filter(
        AudienceDataSyncImportedPersons.id == data_sync_id
    ).update({"status": status})
    session.db.commit()


def get_previous_imported_enrichment_users(
    session, data_sync_id, data_sync_limit
):
    query = (
        session.query(
            AudienceSmartPerson.enrichment_user_asid,
        )
        .join(
            AudienceDataSyncImportedPersons,
            AudienceDataSyncImportedPersons.enrichment_user_asid
            == AudienceSmartPerson.enrichment_user_asid,
        )
        .join(
            AudienceSmart,
            AudienceSmart.id == AudienceSmartPerson.smart_audience_id,
        )
        .join(
            IntegrationUserSync,
            IntegrationUserSync.smart_audience_id == AudienceSmart.id,
        )
        .join(
            UserIntegration,
            UserIntegration.id == IntegrationUserSync.integration_id,
        )
        .filter(
            AudienceDataSyncImportedPersons.data_sync_id == data_sync_id,
            AudienceDataSyncImportedPersons.status
            == DataSyncImportedStatus.SENT.value,
        )
        .limit(data_sync_limit)
    )

    return [
        {"asid": str(row.enrichment_user_asid)}
        for row in query
        if row.enrichment_user_asid
    ]


async def send_leads_to_rmq(
    session,
    channel,
    enrichment_users,
    data_sync,
    user_integrations_service_name,
):
    enrichment_user_asids = [
        enrichment_user["asid"]
        if isinstance(enrichment_user, dict)
        else enrichment_user.id
        for enrichment_user in enrichment_users
    ]
    records = [
        {
            "status": DataSyncImportedStatus.SENT.value,
            "enrichment_user_asid": enrichment_user_asid,
            "service_name": user_integrations_service_name,
            "data_sync_id": data_sync.id,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        for enrichment_user_asid in enrichment_user_asids
    ]
    stmt = (
        insert(AudienceDataSyncImportedPersons)
        .values(records)
        .on_conflict_do_nothing(
            index_elements=["enrichment_user_asid", "data_sync_id"]
        )
        .returning(
            AudienceDataSyncImportedPersons.enrichment_user_asid,
            AudienceDataSyncImportedPersons.id,
        )
    )
    session.execute(stmt)
    session.commit()

    results = select(
        AudienceDataSyncImportedPersons.enrichment_user_asid,
        AudienceDataSyncImportedPersons.id,
    ).where(
        AudienceDataSyncImportedPersons.enrichment_user_asid.in_(
            enrichment_user_asids
        ),
        AudienceDataSyncImportedPersons.data_sync_id == data_sync.id,
    )

    inserted_map = {
        row["enrichment_user_asid"]: row["id"]
        for row in session.execute(results).mappings().all()
    }

    arr_enrichment_users = [
        {
            "data_sync_imported_id": str(imported_id),
            "enrichment_user_asid": str(asid),
        }
        for asid, imported_id in inserted_map.items()
    ]

    msg = {
        "data_sync_id": data_sync.id,
        "arr_enrichment_users": arr_enrichment_users,
    }
    await send_leads_to_queue(channel, msg)


async def process_user_integrations(
    channel, pg_session, subscription_service: SubscriptionService
):
    user_integrations, data_syncs = fetch_data_syncs(pg_session)
    for i, data_sync in enumerate(data_syncs):
        if not subscription_service.is_user_has_active_subscription(
            user_integrations[i].user_id
        ):
            logging.info(
                f"Skip, subscription is not active for user {user_integrations[i].user_id}"
            )
            continue
        logging.info(f"Processes Data sync id: {data_sync.id}")
        if (
            data_sync.sync_status == False
            or user_integrations[i].is_failed == True
            or data_sync.is_active == False
        ):
            logging.info(
                f"Skip, Integration is failed {user_integrations[i].is_failed}, Data sync status {data_sync.sync_status}"
            )
            continue

        imported_count = update_data_sync_integration(
            session=pg_session,
            data_sync_id=data_sync.id,
            data_sync=data_sync,
            last_sync_date=False,
        )
        if (data_sync.sent_contacts - imported_count) <= 0:
            logging.info(f"Skip, Integration sent_contacts == imported_count")
            continue

        limit = user_integrations[i].limit
        data_sync_limit = min(limit, data_sync.sent_contacts - imported_count)

        enrichment_users = get_previous_imported_enrichment_users(
            session=pg_session,
            data_sync_id=data_sync.id,
            data_sync_limit=data_sync_limit,
        )

        logging.info(f"Re imported leads= {len(enrichment_users)}")
        query_limit = data_sync_limit - len(enrichment_users)
        if query_limit > 0 and query_limit <= data_sync_limit:
            enrichment_user_asids = get_enrichment_user_ids_from_pg(
                db_session=pg_session,
                data_sync_id=data_sync.id,
                limit=query_limit,
                last_sent_enrichment_id=data_sync.last_sent_enrichment_id,
            )
            enrichment_users.extend(enrichment_user_asids)

        if not enrichment_users:
            logging.info(f"enrichment_users empty")
            continue

        logging.info(f"enrichment_users len = {len(enrichment_users)}")
        enrichment_users = sorted(enrichment_users, key=lambda x: x["asid"])

        user = (
            pg_session.query(Users)
            .filter(Users.id == user_integrations[i].user_id)
            .with_for_update()
            .first()
        )

        if user is None:
            logging.warning(f"User {user_integrations[i].user_id} not found")
            continue

        # Проверка лимита smart_audience_quota
        quota = user.smart_audience_quota
        if quota is None:
            quota = -1

        is_unlimited = quota == -1

        if not is_unlimited and quota <= 0:
            logging.info(
                f"Skip: User {user.id} has 0 smart_audience_quota credits for data sync"
            )
            continue
        elif quota > 0:
            if len(enrichment_users) > quota:
                logging.info(
                    f"User {user.id} has only {quota} credits left."
                    + f"Limiting enrichment_users from {len(enrichment_users)} to {quota}"
                )
                enrichment_users = enrichment_users[:quota]

        await send_leads_to_rmq(
            pg_session,
            channel,
            enrichment_users,
            data_sync,
            user_integrations[i].service_name,
        )
        last_enrichment_asid = enrichment_users[-1]["asid"]
        if last_enrichment_asid:
            logging.info(f"last_lead_id = {last_enrichment_asid}")
            update_last_sent_enrichment_user(
                pg_session, data_sync.id, last_enrichment_asid
            )
            update_data_sync_integration(pg_session, data_sync.id, data_sync)


async def main():
    await SentryConfig.async_initilize()
    log_level = logging.INFO
    if len(sys.argv) > 1:
        arg = sys.argv[1].upper()
        if arg == "DEBUG":
            log_level = logging.DEBUG
        elif arg == "INFO":
            log_level = logging.INFO
        else:
            sys.exit("Invalid log level argument. Use 'DEBUG' or 'INFO'.")

    setup_logging(log_level)
    logging.info("Started")
    sleep_interval = LONG_SLEEP
    while True:
        pg_session = None
        rabbitmq_connection = None
        resolver = Resolver()
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
                pg_session = await resolver.resolve(Db)
                subscription_service = await resolver.resolve(
                    SubscriptionService
                )
                await process_user_integrations(
                    channel, pg_session, subscription_service
                )
                logging.info("Processing completed. Sleeping for 10 sec...")
            else:
                logging.info("Queue is not empty. Skipping processing.")
        except Exception as err:
            logging.error("Unhandled Exception:", exc_info=True)
            SentryConfig.capture(err)
        finally:
            if pg_session:
                logging.info("Closing the database postgresql session...")
                pg_session.close()
            if rabbitmq_connection:
                logging.info("Closing RabbitMQ connection...")
                await rabbitmq_connection.close()
        await asyncio.sleep(sleep_interval)


if __name__ == "__main__":
    asyncio.run(main())
