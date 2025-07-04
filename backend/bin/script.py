import asyncio
import csv
import logging
import os
import sys
from typing import Set


current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from models import (
    DataSyncImportedLead,
    LeadUser,
    FiveXFiveUsersEmails,
    FiveXFiveUser,
    FiveXFiveEmails,
)
from config.sentry import SentryConfig
from persistence.user_persistence import UserPersistence
from persistence.user_subscriptions import UserSubscriptionsPersistence
from resolver import Resolver
from db_dependencies import Db

from enums import PlanAlias
from sqlalchemy.orm import Session

logging.basicConfig(level=logging.INFO)


from collections import defaultdict


def refresh_basic_lead_credits(db_session: Db, input_emails: Set[str]):
    # Сначала получаем пары lead_user_id и email
    results = (
        db_session.query(LeadUser.id, FiveXFiveEmails.email)
        .join(FiveXFiveUser, FiveXFiveUser.id == LeadUser.five_x_five_user_id)
        .join(
            FiveXFiveUsersEmails,
            FiveXFiveUsersEmails.user_id == FiveXFiveUser.id,
        )
        .join(
            FiveXFiveEmails, FiveXFiveEmails.id == FiveXFiveUsersEmails.email_id
        )
        .join(
            DataSyncImportedLead,
            DataSyncImportedLead.lead_users_id == LeadUser.id,
        )
        .filter(
            DataSyncImportedLead.data_sync_id == 769,
            DataSyncImportedLead.status == "success",
        )
        .all()
    )

    # Группируем email'ы по lead_user_id
    lead_to_emails = defaultdict(set)
    for lead_id, email in results:
        lead_to_emails[lead_id].add(email.lower())

    # Вычисляем, какие лиды нужно исключить (у которых хотя бы один email в input_emails)
    lead_ids_to_exclude = set()
    for lead_id, emails in lead_to_emails.items():
        if emails & input_emails:
            lead_ids_to_exclude.add(lead_id)

    # Оставшиеся лиды (все их email'ы — пропущенные)
    missing_emails = set()
    for lead_id, emails in lead_to_emails.items():
        if lead_id not in lead_ids_to_exclude:
            missing_emails.update(emails)

    logging.info(f"Total leads: {len(lead_to_emails)}")
    logging.info(
        f"Leads with at least one matched email: {len(lead_ids_to_exclude)}"
    )
    logging.info(
        f"Leads fully missing: {len(lead_to_emails) - len(lead_ids_to_exclude)}"
    )
    logging.info(f"Total missing emails: {len(missing_emails)}")

    for email in missing_emails:
        print("Missing:", email)

    return missing_emails


def load_emails_from_csv(path: str) -> Set[str]:
    emails = set()
    with open(path, newline="", encoding="utf-8") as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            if row:
                emails.add(row[0].strip().lower())
    return emails


async def main():
    await SentryConfig.async_initilize()
    logging.info("Started")
    db_session = None

    csv_path = "tmp/emails.csv"

    input_emails = load_emails_from_csv(csv_path)

    resolver = Resolver()
    try:
        db_session = await resolver.resolve(Db)
        refresh_basic_lead_credits(
            db_session=db_session,
            input_emails=input_emails,
        )

    except Exception as err:
        logging.error(f"Unhandled Exception: {err}", exc_info=True)
        db_session.rollback()
        SentryConfig.capture(err)
    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        logging.info("Shutting down...")


if __name__ == "__main__":
    asyncio.run(main())
