import argparse
import asyncio
import json
import logging
import os
import sys
import time
import traceback
import urllib
from datetime import datetime, timedelta
from typing import Any

from dotenv import load_dotenv
from sqlalchemy import desc
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)


from config.sentry import SentryConfig
from utils import normalize_url, get_url_params_list
from db_dependencies import Db

from resolver import Resolver
from models import FiveXFiveAnonymousCookieSync
from models.anonymous_requests import AnonymousRequests
from models.anonymous_visits import AnonymousVisits
from models.five_x_five_cookie_sync_file import FiveXFiveCookieSyncFile
from models.leads_requests import LeadsRequests
from models.users_domains import UserDomains
from models.leads_visits import LeadsVisits
from models.users import Users

from config.rmq_connection import (
    RabbitMQConnection,
)

load_dotenv()


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


LAST_PROCESSED_FILE_PATH = "tmp/last_processed_anonymous_sync.txt"


def normalize_domain(domain: str):
    if domain.startswith("https://"):
        domain = domain[8:]
    elif domain.startswith("http://"):
        domain = domain[7:]
    if domain.startswith("www."):
        domain = domain[4:]

    domain = domain.split("/")[0]

    return domain.lower()


def group_requests_by_date(request_row, groupped_requests):
    key = f"{request_row.event_date}_{request_row.ip}"
    if key not in groupped_requests:
        groupped_requests[key] = []
    lead_info = {
        "TROVO_ID": request_row.trovo_id,
        "PARTNER_ID": request_row.partner_id,
        "PARTNER_UID": request_row.partner_uid,
        "IP": request_row.ip,
        "JSON_HEADERS": request_row.json_headers,
        "EVENT_DATE": request_row.event_date,
    }
    groupped_requests[key].append(lead_info)


async def process_table(
    session: Session,
    groupped_requests,
):
    for key, possible_anonymouses in groupped_requests.items():
        for possible_anonymous in reversed(possible_anonymouses):
            await process_user_data(
                possible_anonymous,
                session,
            )


def decode_partner_uid(partner_uid: str) -> dict[str, Any] | None:
    try:
        partner_uid_decoded = urllib.parse.unquote(str(partner_uid).lower())
        partner_uid_dict = json.loads(partner_uid_decoded)
        return partner_uid_dict
    except Exception:
        return None


async def process_user_data(
    possible_anonymous,
    session: Session,
):
    ip = possible_anonymous["IP"]
    trovo_id: str | None = possible_anonymous["TROVO_ID"]
    partner_uid: str | None = possible_anonymous["PARTNER_UID"]
    partner_uid_dict = decode_partner_uid(str(partner_uid))
    partner_uid_client_id = partner_uid_dict.get("client_id")
    page = partner_uid_dict.get("current_page")
    puci = str(partner_uid_client_id)
    if (
        puci
        == "2e23d46218de1cce79dc14427bf97a6484c0c729757007988f6f0dcf17a144a8"
    ):
        puci = (
            "edf1a2e46075f1b2ae6caddad58fac17c702f6a17373a7a0067583c0d2ac34cb"
        )
    if (
        puci
        == "f8f664a05426a4593af10265803ad4ecb0eae25e7622e753ef0ea08218ec33cb"
        and page != None
        and "joinfridays.com" in page
    ):
        puci = (
            "b51f31b2181ab13b0a125f37cac5641f12a29b5bb63b8d54f7b5fb1d3c0cb434"
        )

    result = (
        session.query(Users, UserDomains)
        .join(UserDomains, UserDomains.user_id == Users.id)
        .filter(UserDomains.data_provider_id == puci)
        .first()
    )
    if not result:
        logging.info(f"Customer not found {partner_uid_client_id}")
        return
    user, user_domain = result

    if normalize_domain(page) != normalize_domain(user_domain.domain):
        logging.info(
            f"Access denied: normalized page domain '{normalize_domain(page)}' does not match user domain '{user_domain.domain}'"
        )
        if not user_domain.is_another_domain_resolved:
            user_domain.is_another_domain_resolved = True
        return

    if not user_domain.is_enable:
        logging.info(f"Domain disabled: {user_domain.id}")
        return
    domain_id = user_domain.id

    if page is None:
        json_headers = json.loads(
            str(possible_anonymous["JSON_HEADERS"]).lower()
        )
        referer = json_headers.get("referer")[0]
        page = referer

    requested_at_str = str(possible_anonymous["EVENT_DATE"])
    requested_at = datetime.fromisoformat(requested_at_str).replace(tzinfo=None)
    thirty_minutes_ago = requested_at - timedelta(minutes=30)
    current_visit_request = (
        session.query(AnonymousRequests.visit_id.label("visit_id"))
        .filter(
            AnonymousRequests.trovo_id == trovo_id,
            AnonymousRequests.domain_id == domain_id,
            AnonymousRequests.requested_at >= thirty_minutes_ago,
        )
        .first()
    )
    if current_visit_request:
        visit_id = current_visit_request.visit_id
        leads_result = (
            session.query(
                AnonymousRequests.requested_at.label("requested_at"),
                AnonymousRequests.page.label("page"),
            )
            .filter(AnonymousRequests.visit_id == visit_id)
            .all()
        )
        leads_requests = []
        for result_row in leads_result:
            leads_requests.append([result_row.requested_at, result_row.page])

        process_anonymous_requests(
            requested_at=requested_at,
            page=page,
            leads_requests=leads_requests,
            visit_id=visit_id,
            session=session,
        )
    else:
        visit_id = add_new_anonymous_visits(
            visited_datetime=requested_at,
            session=session,
            trovo_id=trovo_id,
            domain_id=domain_id,
            ip=ip,
        ).id

    lead_request = (
        insert(AnonymousRequests)
        .values(
            domain_id=domain_id,
            page_parameters=get_url_params_list(page),
            page=normalize_url(page),
            requested_at=requested_at,
            visit_id=visit_id,
            trovo_id=trovo_id,
            spent_time_sec=10,
        )
        .on_conflict_do_nothing()
    )
    session.execute(lead_request)
    session.flush()
    session.commit()


def process_anonymous_requests(
    requested_at,
    page,
    leads_requests,
    visit_id,
    session: Session,
):
    new_request = [
        requested_at,
        page,
    ]
    leads_requests.append(new_request)

    leads_requests_sorted = sorted(leads_requests, key=lambda r: r[0])

    start_date_time = leads_requests_sorted[0][0]
    end_date_time = leads_requests_sorted[-1][0]

    start_date = start_date_time.date()
    start_time = start_date_time.time()
    end_date = end_date_time.date()
    end_time = end_date_time.time()
    total_time_sec = int((end_date_time - start_date_time).total_seconds() + 10)
    pages_set = set()
    for i in range(len(leads_requests_sorted)):
        current_request = leads_requests_sorted[i]
        if current_request[1]:
            pages_set.add(normalize_url(current_request[1]))

    pages_count = len(pages_set)
    average_time_sec = int(total_time_sec / len(leads_requests_sorted))

    session.query(AnonymousVisits).filter_by(id=visit_id).update(
        {
            "start_date": start_date,
            "start_time": start_time,
            "end_date": end_date,
            "end_time": end_time,
            "pages_count": pages_count,
            "full_time_sec": total_time_sec,
            "average_time_sec": average_time_sec,
        }
    )
    session.flush()


def add_new_anonymous_visits(
    visited_datetime: datetime,
    session: Db,
    trovo_id: str,
    domain_id: int,
    ip: str,
):
    start_date = visited_datetime.date()
    start_time = visited_datetime.time()
    date_page = visited_datetime + timedelta(seconds=10)
    end_date = date_page.date()
    end_time = date_page.time()
    anonymous_visits = AnonymousVisits(
        start_date=start_date,
        start_time=start_time,
        end_date=end_date,
        end_time=end_time,
        pages_count=1,
        trovo_id=trovo_id,
        domain_id=domain_id,
        ip=ip,
    )
    session.add(anonymous_visits)
    session.flush()

    session.flush()
    return anonymous_visits


def update_last_processed_file(file_key):
    with open(LAST_PROCESSED_FILE_PATH, "w") as file:
        file.write(file_key)


async def process_files(
    db_session: Session,
):
    while True:
        try:
            with open(LAST_PROCESSED_FILE_PATH, "r") as file:
                last_processed_file = file.read().strip()
        except FileNotFoundError:
            last_processed_file = None

        five_x_five_anonymous_cookie_sync_event_date = db_session.query(
            FiveXFiveAnonymousCookieSync.event_date
        )

        if last_processed_file:
            if "." in last_processed_file:
                date_object = datetime.strptime(
                    last_processed_file, "%Y-%m-%d %H:%M:%S.%f"
                )
            else:
                date_object = datetime.strptime(
                    last_processed_file, "%Y-%m-%d %H:%M:%S"
                )
            five_x_five_anonymous_cookie_sync_event_date = (
                five_x_five_anonymous_cookie_sync_event_date.filter(
                    FiveXFiveAnonymousCookieSync.event_date > date_object
                )
            )

        five_x_five_anonymous_cookie_sync_event_date = (
            five_x_five_anonymous_cookie_sync_event_date.order_by(
                FiveXFiveAnonymousCookieSync.event_date
            )
        )
        event_date = five_x_five_anonymous_cookie_sync_event_date.limit(
            1
        ).scalar()
        if not event_date:
            logging.info("No data in 5x5 files yet")
            return

        new_dt = event_date + timedelta(hours=1)
        cookie_sync_files_query = db_session.query(
            FiveXFiveAnonymousCookieSync
        ).filter(
            FiveXFiveAnonymousCookieSync.event_date.between(event_date, new_dt)
        )
        cookie_sync_files = cookie_sync_files_query.order_by(
            FiveXFiveAnonymousCookieSync.event_date
        ).all()
        last_processed_file_name = ""
        groupped_requests = {}
        for request_row in cookie_sync_files:
            group_requests_by_date(request_row, groupped_requests)
            last_processed_file_name = request_row.event_date
        if not groupped_requests:
            logging.info("All 5x5 files processed")
            return

        await process_table(
            db_session,
            groupped_requests,
        )
        logging.debug(
            f"Last processed event time {str(last_processed_file_name)}"
        )
        update_last_processed_file(str(last_processed_file_name))


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--log", choices=["INFO", "DEBUG"], default="INFO")
    return parser.parse_args()


async def main():
    await SentryConfig.async_initilize()
    resolver = Resolver()
    db_session = await resolver.resolve(Db)
    rabbitmq_connection = RabbitMQConnection()
    connection = await rabbitmq_connection.connect()
    args = parse_args()
    log_level = logging.DEBUG if args.log == "DEBUG" else logging.INFO
    setup_logging(log_level)
    logging.info("Started")
    while True:
        try:
            await process_files(
                db_session=db_session,
            )
            await connection.close()
            logging.info("Sleeping for 10 minutes...")
            time.sleep(60 * 10)
            connection = await rabbitmq_connection.connect()
            logging.info("Reconnected to RabbitMQ")
        except Exception as e:
            db_session.rollback()
            logging.error(f"An error occurred: {str(e)}")
            SentryConfig.capture(e)
            traceback.print_exc()
            await resolver.cleanup()
            time.sleep(30)


asyncio.run(main())
