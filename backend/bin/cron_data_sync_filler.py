import asyncio
import logging
import os
import sys
from collections import defaultdict

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from sqlalchemy.sql import exists
from db_dependencies import Db
from resolver import Resolver
from services.data_sync_imported_lead import DataSyncImportedService
from services.leads import LeadsService
from models import Users
from config.sentry import SentryConfig
from config.rmq_connection import (
    publish_rabbitmq_message_with_channel,
    RabbitMQConnection,
)
from sqlalchemy import and_, or_, select
from dotenv import load_dotenv
from models.leads_visits import LeadsVisits
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from enums import (
    DataSyncImportedStatus,
    ProccessDataSyncResult,
    SourcePlatformEnum,
    DataSyncType,
)
from utils import get_utc_aware_date
from models.leads_users_added_to_cart import LeadsUsersAddedToCart
from models.leads_users_ordered import LeadsUsersOrdered
from models.users_domains import UserDomains
from sqlalchemy.dialects.postgresql import insert
from models.integrations.integrations_users_sync import IntegrationUserSync
from models.integrations.users_domains_integrations import UserIntegration
from models.data_sync_imported_leads import DataSyncImportedLead
from models.leads_users import LeadUser

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


async def send_leads_to_queue(channel, processed_lead):
    await publish_rabbitmq_message_with_channel(
        channel=channel,
        queue_name=CRON_DATA_SYNC_LEADS,
        message_body=processed_lead,
    )


def fetch_data_syncs(session):
    user_integrations = (
        session.query(UserIntegration)
        .filter(
            exists().where(
                IntegrationUserSync.integration_id == UserIntegration.id
            )
        )
        .all()
    )
    integration_ids = [ui.id for ui in user_integrations]
    if not integration_ids:
        return user_integrations, {}

    data_syncs = (
        session.query(IntegrationUserSync)
        .filter(IntegrationUserSync.integration_id.in_(integration_ids))
        .all()
    )

    syncs_by_integration_id = defaultdict(list)
    for sync in data_syncs:
        syncs_by_integration_id[sync.integration_id].append(sync)

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


def fetch_leads_by_domain(
    session: Session, domain_id, limit, last_sent_lead_id, data_sync_leads_type
):
    current_date_time = datetime.now(timezone.utc)
    past_time = current_date_time - timedelta(hours=2)
    past_date = past_time.date()
    past_time = past_time.time()
    if last_sent_lead_id is None:
        last_sent_lead_id = 0

    query = (
        session.query(
            LeadUser.id.label("id"),
            LeadUser.user_id.label("user_id"),
            LeadUser.five_x_five_user_id.label("five_x_five_user_id"),
        )
        .join(UserDomains, UserDomains.id == LeadUser.domain_id)
        .join(LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id)
        .join(
            IntegrationUserSync, IntegrationUserSync.domain_id == UserDomains.id
        )
        .filter(
            LeadUser.domain_id == domain_id,
            IntegrationUserSync.sync_type == DataSyncType.CONTACT.value,
            LeadUser.id > last_sent_lead_id,
            LeadUser.is_active == True,
            UserDomains.is_enable == True,
            (LeadsVisits.start_date < past_date)
            | (
                LeadsVisits.start_date == past_date
                and LeadsVisits.start_time <= past_time
            ),
            LeadUser.is_confirmed == True,
        )
    )

    if data_sync_leads_type != "allContacts":
        if data_sync_leads_type == "converted_sales":
            query = (
                query.outerjoin(
                    LeadsUsersAddedToCart,
                    LeadsUsersAddedToCart.lead_user_id == LeadUser.id,
                )
                .outerjoin(
                    LeadsUsersOrdered,
                    LeadsUsersOrdered.lead_user_id == LeadUser.id,
                )
                .filter(
                    or_(
                        and_(
                            LeadUser.behavior_type != "product_added_to_cart",
                            LeadUser.is_converted_sales == True,
                        ),
                        and_(
                            LeadUser.is_converted_sales == True,
                            LeadsUsersOrdered.ordered_at.isnot(None),
                            LeadsUsersAddedToCart.added_at
                            < LeadsUsersOrdered.ordered_at,
                        ),
                    )
                )
            )

        elif data_sync_leads_type == "viewed_product":
            query = query.filter(
                and_(
                    LeadUser.behavior_type == "viewed_product",
                    LeadUser.is_converted_sales == False,
                )
            )

        elif data_sync_leads_type == "visitor":
            query = query.filter(
                and_(
                    LeadUser.behavior_type == "visitor",
                    LeadUser.is_converted_sales == False,
                )
            )

        elif data_sync_leads_type == "abandoned_cart":
            query = (
                query.outerjoin(
                    LeadsUsersAddedToCart,
                    LeadsUsersAddedToCart.lead_user_id == LeadUser.id,
                )
                .outerjoin(
                    LeadsUsersOrdered,
                    LeadsUsersOrdered.lead_user_id == LeadUser.id,
                )
                .filter(
                    and_(
                        LeadUser.behavior_type == "product_added_to_cart",
                        LeadUser.is_converted_sales == False,
                        LeadsUsersAddedToCart.added_at.isnot(None),
                        or_(
                            LeadsUsersAddedToCart.added_at
                            > LeadsUsersOrdered.ordered_at,
                            and_(
                                LeadsUsersOrdered.ordered_at.is_(None),
                                LeadsUsersAddedToCart.added_at.isnot(None),
                            ),
                        ),
                    )
                )
            )
    result = (
        query.distinct(LeadUser.id).order_by(LeadUser.id).limit(limit).all()
    )

    return result or []


def update_last_sent_lead(session, data_sync_id, last_lead_id):
    session.query(IntegrationUserSync).filter(
        IntegrationUserSync.id == data_sync_id
    ).update({IntegrationUserSync.last_sent_lead_id: last_lead_id})
    session.commit()


def update_data_sync_imported_leads(session, status, data_sync_id):
    session.db.query(DataSyncImportedLead).filter(
        DataSyncImportedLead.id == data_sync_id
    ).update({"status": status})
    session.db.commit()


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


def is_email_validation_enabled(session: Session, users_id: int) -> bool:
    result = (
        session.query(Users.is_email_validation_enabled)
        .filter(Users.id == users_id)
        .scalar()
    )
    return result


async def send_leads_to_rmq(
    session,
    channel,
    lead_users,
    data_sync,
    user_integrations_service_name,
):
    lead_ids = [lead_user.id for lead_user in lead_users]
    users_id = lead_users[-1].user_id
    records = [
        {
            "status": DataSyncImportedStatus.SENT.value,
            "lead_users_id": lead_id,
            "is_validation": is_email_validation_enabled(
                session=session, users_id=users_id
            ),
            "service_name": user_integrations_service_name,
            "data_sync_id": data_sync.id,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        for lead_id in lead_ids
    ]
    stmt = (
        insert(DataSyncImportedLead)
        .values(records)
        .on_conflict_do_nothing(
            index_elements=["lead_users_id", "data_sync_id"]
        )
    )

    session.execute(stmt)
    session.commit()
    result = session.execute(
        select(DataSyncImportedLead.id)
        .where(DataSyncImportedLead.lead_users_id.in_(lead_ids))
        .where(DataSyncImportedLead.data_sync_id == data_sync.id)
    )
    data_sync_imported_ids = [row.id for row in result]

    processed_lead = {
        "data_sync_id": data_sync.id,
        "data_sync_imported_ids": data_sync_imported_ids,
        "users_id": users_id,
        "service_name": user_integrations_service_name,
    }
    await send_leads_to_queue(channel, processed_lead)


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

            lead_users = get_previous_imported_leads(db_session, data_sync.id)

            data_sync_limit = user_integration.limit
            if data_sync_limit - len(lead_users) > 0:
                additional_leads = leads_service.data_sync_leads_type(
                    domain_id=data_sync.domain_id,
                    limit=data_sync_limit - len(lead_users),
                    leads_type=data_sync.leads_type,
                    last_sent_lead_id=data_sync.last_sent_lead_id,
                )
                lead_users.extend(additional_leads)

            update_data_sync_integration(db_session, data_sync.id)

            if not lead_users:
                logging.info(f"Pixel sync {data_sync.id} Lead users empty")
                continue

            logging.info(
                f"Pixel sync {data_sync.id} lead users len = {len(lead_users)}"
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
                update_last_sent_lead(db_session, data_sync.id, last_lead_id)
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
