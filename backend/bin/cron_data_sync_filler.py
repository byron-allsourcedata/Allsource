import asyncio
import logging
import os
import sys

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from models import Users
from config.sentry import SentryConfig
from config.rmq_connection import (
    publish_rabbitmq_message_with_channel,
    RabbitMQConnection,
)
from sqlalchemy import create_engine, and_, or_, select
from dotenv import load_dotenv
from models.leads_visits import LeadsVisits
from sqlalchemy.orm import sessionmaker, Session
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
    results = (
        session.query(UserIntegration, IntegrationUserSync)
        .join(
            IntegrationUserSync,
            IntegrationUserSync.integration_id == UserIntegration.id,
        )
        .all()
    )
    user_integrations = [res[0] for res in results]
    data_syncs = [res[1] for res in results]

    return user_integrations, data_syncs


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
        .join(LeadsVisits, LeadsVisits.lead_id == LeadUser.id)
        .filter(
            DataSyncImportedLead.data_sync_id == data_sync_id,
            DataSyncImportedLead.status == DataSyncImportedStatus.SENT.value,
            LeadUser.is_active == True,
            UserDomains.is_enable == True,
        )
        .all()
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


async def process_user_integrations(channel, session):
    user_integrations, data_syncs = fetch_data_syncs(session)
    for i, data_sync in enumerate(data_syncs):
        if (
            data_sync.sync_status == False
            or user_integrations[i].is_failed == True
        ):
            if (
                user_integrations[i].service_name
                == SourcePlatformEnum.WEBHOOK.value
            ):
                if (
                    data_sync.last_sync_date is not None
                    and data_sync.last_sync_date.replace(tzinfo=timezone.utc)
                    > (datetime.now(timezone.utc) - timedelta(hours=24))
                ) or (
                    data_sync.created_at.replace(tzinfo=timezone.utc)
                    > (datetime.now(timezone.utc) - timedelta(hours=24))
                ):
                    logging.info(
                        f"Attempt after failed Webhook, last_sync_date = {data_sync.last_sync_date}"
                    )

                else:
                    logging.info(
                        f"Skip, Integration is failed {user_integrations[i].is_failed}, Data sync status {data_sync.sync_status}"
                    )
                    continue

            else:
                logging.info(
                    f"Skip, Integration is failed {user_integrations[i].is_failed}, Data sync status {data_sync.sync_status}"
                )
                continue

        if data_sync.is_active == False:
            continue

        lead_users = get_previous_imported_leads(session, data_sync.id)
        logging.info(
            f"Pixel sync {data_sync.id} Re imported leads= {len(lead_users)}"
        )
        data_sync_limit = user_integrations[i].limit
        if data_sync_limit - len(lead_users) > 0:
            additional_leads = fetch_leads_by_domain(
                session,
                data_sync.domain_id,
                data_sync_limit - len(lead_users),
                data_sync.last_sent_lead_id,
                data_sync.leads_type,
            )
            lead_users.extend(additional_leads)

        update_data_sync_integration(session, data_sync.id)
        if not lead_users:
            logging.info(f"Pixel sync {data_sync.id} Lead users empty")
            continue

        logging.info(
            f"Pixel sync {data_sync.id} lead users len = {len(lead_users)}"
        )
        lead_users = sorted(lead_users, key=lambda x: x.id)
        await send_leads_to_rmq(
            session,
            channel,
            lead_users,
            data_sync,
            user_integrations[i].service_name,
        )
        last_lead_id = lead_users[-1].id
        if last_lead_id:
            logging.info(
                f"Pixel sync {data_sync.id} last_lead_id = {last_lead_id}"
            )
            update_last_sent_lead(session, data_sync.id, last_lead_id)
            update_data_sync_integration(session, data_sync.id)


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

    db_username = os.getenv("DB_USERNAME")
    db_password = os.getenv("DB_PASSWORD")
    db_host = os.getenv("DB_HOST")
    db_name = os.getenv("DB_NAME")

    engine = create_engine(
        f"postgresql://{db_username}:{db_password}@{db_host}/{db_name}",
        pool_pre_ping=True,
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

            await process_user_integrations(channel, db_session)

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
