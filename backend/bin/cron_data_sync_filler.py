import asyncio
import logging
import os
import sys
from collections import defaultdict
from uuid import UUID

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from db_dependencies import Db
from resolver import Resolver
from services.data_sync_imported_lead import DataSyncImportedService
from services.leads import LeadsService
from config.sentry import SentryConfig
from config.rmq_connection import (
    RabbitMQConnection,
)
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
from enums import (
    DataSyncImportedStatus,
    ProccessDataSyncResult,
    SourcePlatformEnum,
    DataSyncType,
)
from utils import get_utc_aware_date
from models.users_domains import UserDomains
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from models.data_sync_imported_leads import DataSyncImportedLead
from models.leads_users import LeadUser

from persistence.delivr.client import AsyncDelivrClickHouseClient
from persistence.delivr.leads_users_ch_repo import LeadsUsersCHRepository

load_dotenv()

CRON_DATA_SYNC_LEADS = "cron_data_sync_leads"
BATCH_SIZE = 200
SLEEP_INTERVAL = 60 * 1


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def fetch_data_syncs(session):
    rows = (
        session.query(UserIntegration, IntegrationUserSync)
        .join(
            IntegrationUserSync,
            IntegrationUserSync.integration_id == UserIntegration.id,
        )
        .filter(IntegrationUserSync.sync_type == DataSyncType.CONTACT.value)
        .all()
    )

    user_integrations = []
    syncs_by_integration_id = defaultdict(list)
    seen_ids = set()

    for ui, sync in rows:
        if ui.id not in seen_ids:
            seen_ids.add(ui.id)
            user_integrations.append(ui)
        syncs_by_integration_id[ui.id].append(sync)

    return user_integrations, syncs_by_integration_id


def update_data_sync_integration(session, data_sync_id):
    no_of_contacts = (
        session.query(DataSyncImportedLead)
        .filter(
            DataSyncImportedLead.status == ProccessDataSyncResult.SUCCESS.value,
            DataSyncImportedLead.data_sync_id == data_sync_id,
        )
        .count()
    )
    update_data = {
        "last_sync_date": get_utc_aware_date(),
        "no_of_contacts": no_of_contacts,
    }

    session.query(IntegrationUserSync).filter(
        IntegrationUserSync.id == data_sync_id
    ).update(update_data)
    session.commit()


def update_last_sent_lead(session, data_sync_id, last_lead_id):
    session.query(IntegrationUserSync).filter(
        IntegrationUserSync.id == data_sync_id
    ).update({IntegrationUserSync.last_sent_lead_id: last_lead_id})
    session.commit()


def update_last_sent_ch_lead(session, data_sync_id, last_ch_lead_id):
    session.query(IntegrationUserSync).filter(
        IntegrationUserSync.id == data_sync_id
    ).update({IntegrationUserSync.last_sent_ch_lead_id: last_ch_lead_id})
    session.commit()


def get_previous_imported_leads(session, data_sync_id):
    lead_users = (
        session.query(
            LeadUser.id.label("id"),
            LeadUser.user_id.label("user_id"),
            LeadUser.five_x_five_user_id.label("five_x_five_user_id"),
        )
        .join(
            DataSyncImportedLead,
            DataSyncImportedLead.lead_users_id == LeadUser.id,
        )
        .join(UserDomains, UserDomains.id == LeadUser.domain_id)
        .filter(
            DataSyncImportedLead.data_sync_id == data_sync_id,
            DataSyncImportedLead.status == DataSyncImportedStatus.SENT.value,
            LeadUser.is_active == True,
            UserDomains.is_enable == True,
        )
        .all()
    )

    logging.info(
        f"Pixel sync {data_sync_id} Re imported leads= {len(lead_users)}"
    )

    return lead_users


async def process_user_integrations(
    db_session: Db,
    leads_service: LeadsService,
    data_sync_imported_service: DataSyncImportedService,
):
    user_integrations, syncs_by_integration_id = fetch_data_syncs(db_session)
    for user_integration in user_integrations:
        integration_id = user_integration.id
        data_syncs = syncs_by_integration_id.get(integration_id, [])
        for data_sync in data_syncs:
            if not data_sync.sync_status or user_integration.is_failed:
                if (
                    user_integration.service_name
                    == SourcePlatformEnum.WEBHOOK.value
                ):
                    recent_time = datetime.now(timezone.utc) - timedelta(
                        hours=24
                    )
                    last_sync = data_sync.last_sync_date
                    created_at = data_sync.created_at

                    if (
                        last_sync
                        and last_sync.replace(tzinfo=timezone.utc) > recent_time
                    ) or (
                        created_at
                        and created_at.replace(tzinfo=timezone.utc)
                        > recent_time
                    ):
                        logging.info(
                            f"Attempt after failed Webhook, last_sync_date = {last_sync}"
                        )
                    else:
                        logging.info(
                            f"Skip, Integration is failed {user_integration.is_failed}, Data sync status {data_sync.sync_status}"
                        )
                        continue
                else:
                    logging.info(
                        f"Skip, Integration is failed {user_integration.is_failed}, Data sync status {data_sync.sync_status}"
                    )
                    continue

            if not data_sync.is_active:
                continue

            # 1) Re-import pending PG leads (legacy path)
            lead_users = get_previous_imported_leads(db_session, data_sync.id)

            # 2) Determine remaining quota from integration limit
            data_sync_limit = int(user_integration.limit or 0)
            remaining = max(0, data_sync_limit - len(lead_users))

            # 3) Use legacy PG source only if there is remaining capacity (backward-compat)
            if remaining > 0 and data_sync.leads_type:
                additional_leads = leads_service.data_sync_leads_type(
                    domain_id=data_sync.domain_id,
                    limit=remaining,
                    leads_type=data_sync.leads_type,
                    last_sent_lead_id=data_sync.last_sent_lead_id,
                )
                lead_users.extend(additional_leads)
                remaining = max(0, data_sync_limit - len(lead_users))

            # 4) ClickHouse source (preferred): fetch by pixel_id ordered by UUIDv1 id
            # Resolve pixel_id for the domain
            pixel_id_row = (
                db_session.query(UserDomains.pixel_id)
                .filter(UserDomains.id == data_sync.domain_id)
                .first()
            )
            ch_inserted = 0
            max_ch_id = None
            if pixel_id_row and pixel_id_row[0] is not None and remaining > 0:
                pixel_id_val = str(pixel_id_row[0])
                try:
                    ch = await AsyncDelivrClickHouseClient().connect()
                    ch_repo = LeadsUsersCHRepository(ch)

                    # Re-import pending CH leads (status=SENT)
                    prev_ch_ids = [
                        str(row[0])
                        for row in db_session.query(
                            DataSyncImportedLead.ch_lead_id
                        )
                        .filter(
                            DataSyncImportedLead.data_sync_id == data_sync.id,
                            DataSyncImportedLead.status
                            == DataSyncImportedStatus.SENT.value,
                            DataSyncImportedLead.ch_lead_id.isnot(None),
                        )
                        .all()
                    ]

                    # Fetch next page from ClickHouse leads_users
                    next_rows = await ch_repo.fetch_next_by_pixel(
                        pixel_id=pixel_id_val,
                        last_id=data_sync.last_sent_ch_lead_id,
                        limit=remaining,
                    )
                    next_ch_ids = [str(r["id"]) for r in next_rows]
                    if next_ch_ids:
                        # Maintain progression pointer on the largest id
                        max_ch_id = next_ch_ids[-1]

                    # Combine reimports + new
                    ch_ids_to_send = prev_ch_ids + next_ch_ids

                    if ch_ids_to_send:
                        logging.info(
                            f"Pixel sync {data_sync.id} CH leads to enqueue: prev={len(prev_ch_ids)} new={len(next_ch_ids)}"
                        )
                        await data_sync_imported_service.save_and_send_data_imported_leads_ch(
                            ch_lead_ids=ch_ids_to_send,
                            data_sync=data_sync,
                            user_integrations_service_name=user_integration.service_name,
                            users_id=user_integration.user_id,
                        )
                except Exception as ex:
                    logging.error(
                        f"Pixel sync {data_sync.id} ClickHouse fetch/insert failed: {ex}",
                        exc_info=True,
                    )

            # 5) Update progress pointers
            update_data_sync_integration(db_session, data_sync.id)

            # Legacy PG queueing if any
            if lead_users:
                logging.info(
                    f"Pixel sync {data_sync.id} PG lead users len = {len(lead_users)}"
                )
                lead_users = sorted(lead_users, key=lambda x: x.id)

                await data_sync_imported_service.save_and_send_data_imported_leads(
                    lead_users=lead_users,
                    data_sync=data_sync,
                    user_integrations_service_name=user_integration.service_name,
                )

                last_lead_id = lead_users[-1].id
                if last_lead_id:
                    logging.info(
                        f"Pixel sync {data_sync.id} last_lead_id = {last_lead_id}"
                    )
                    update_last_sent_lead(
                        db_session, data_sync.id, last_lead_id
                    )
                    update_data_sync_integration(db_session, data_sync.id)

            # Update CH progression after enqueue
            if max_ch_id:
                logging.info(
                    f"Pixel sync {data_sync.id} last_sent_ch_lead_id = {max_ch_id}"
                )
                update_last_sent_ch_lead(db_session, data_sync.id, max_ch_id)
                update_data_sync_integration(db_session, data_sync.id)


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
    resolver = Resolver()
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
            db_session = await resolver.resolve(Db)
            leads_service = await resolver.resolve(LeadsService)
            data_sync_imported_service = await resolver.resolve(
                DataSyncImportedService
            )
            await process_user_integrations(
                db_session=db_session,
                leads_service=leads_service,
                data_sync_imported_service=data_sync_imported_service,
            )

            logging.info("Processing completed. Sleeping for 10 minutes...")
        except Exception as e:
            logging.error("Unhandled Exception:", exc_info=True)
            SentryConfig.capture(e)
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
