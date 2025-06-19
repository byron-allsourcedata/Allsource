import asyncio
import logging
import os
import sys
from datetime import datetime, timezone
from typing import List


current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from resolver import Resolver
from db_dependencies import Db
from models.charging_credits_history import ChargingCreditsHistory
from models import Users, UserSubscriptions, SubscriptionPlan
from config.rmq_connection import publish_rabbitmq_message, RabbitMQConnection
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from enums import (
    PlanAlias,
)

load_dotenv()

CHARGE_CREDITS_FILLER = "charge_credits_filler"


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


async def send_leads_to_queue(rmq_connection, processed_lead):
    await publish_rabbitmq_message(
        connection=rmq_connection,
        queue_name=CHARGE_CREDITS_FILLER,
        message_body=processed_lead,
    )


def is_credits_not_charged_this_month(session: Session) -> bool:
    latest_entry = (
        session.query(ChargingCreditsHistory)
        .order_by(ChargingCreditsHistory.created_at.desc())
        .limit(1)
        .first()
    )

    if not latest_entry:
        logging.info(
            "No previous ChargingCreditsHistory entries found. Credits have not been charged this month."
        )
        return True

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    entry_date = latest_entry.created_at
    logging.debug(f"Last credit charge date: {entry_date.isoformat()}")

    if entry_date.year != now.year or entry_date.month != now.month:
        logging.info(
            f"Last charge was in a different month: {entry_date.strftime('%Y-%m')}. Should charge credits."
        )
        return True

    logging.info(
        f"Credits were already charged this month: {entry_date.strftime('%Y-%m')}."
    )
    return False


def save_credits_charge_history(
    session: Session, users_count: int, users_ids: List[int]
) -> ChargingCreditsHistory:
    json_users = [{"user_id": user_id} for user_id in users_ids]
    new_entry = ChargingCreditsHistory(
        users_count=users_count, users_ids=json_users
    )

    session.add(new_entry)
    session.commit()

    logging.info(
        f"Created ChargingCreditsHistory entry: users_count={users_count}, "
        f"user_ids={[user_id for user_id in users_ids]}, time={new_entry.created_at.isoformat()}"
    )

    return new_entry


async def prepare_users_for_billing(
    rmq_connection: RabbitMQConnection, session: Session
):
    if not is_credits_not_charged_this_month(session=session):
        return

    logging.info("Preparing users for billing...")
    results = (
        session.query(
            Users.id.label("id"),
            Users.customer_id.label("customer_id"),
            Users.overage_leads_count.label("overage_leads_count"),
        )
        .join(
            UserSubscriptions,
            UserSubscriptions.id == Users.current_subscription_id,
        )
        .join(
            SubscriptionPlan, SubscriptionPlan.id == UserSubscriptions.plan_id
        )
        .filter(SubscriptionPlan.alias == PlanAlias.BASIC.value)
        .all()
    )
    user_ids = []
    for result in results:
        if result.overage_leads_count <= 0:
            continue
        user_ids.append(result.id)
        msg = {
            "overage_leads_count": result.overage_leads_count,
            "customer_id": result.customer_id,
        }
        await send_leads_to_queue(rmq_connection, msg)

    logging.info(
        f"Successfully sent {len(user_ids)} user IDs to billing queue."
    )
    save_credits_charge_history(
        session=session, users_count=len(user_ids), users_ids=user_ids
    )


async def main():
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
    db_session = await resolver.resolve(Db)
    rabbitmq_connection = None
    try:
        rabbitmq_connection = RabbitMQConnection()
        rmq_connection = await rabbitmq_connection.connect()
        channel = await rmq_connection.channel()
        await channel.set_qos(prefetch_count=1)
        await channel.declare_queue(
            name=CHARGE_CREDITS_FILLER,
            durable=True,
        )

        await prepare_users_for_billing(rmq_connection, db_session)

        logging.info("Processing completed. Sleeping for 10 minutes...")
    except Exception:
        logging.error("Unhandled Exception:", exc_info=True)
    finally:
        if db_session:
            logging.debug("Closing the database session...")
            db_session.close()
        if rabbitmq_connection:
            logging.debug("Closing RabbitMQ connection...")
            await rabbitmq_connection.close()


if __name__ == "__main__":
    asyncio.run(main())
