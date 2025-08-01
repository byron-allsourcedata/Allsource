import asyncio
import functools
import json
import logging
import os
import re
import sys
import time
from decimal import Decimal
from typing import List
from itertools import islice

from smartystreets_python_sdk import (
    StaticCredentials,
    ClientBuilder,
    exceptions as smarty_exc,
)
from smartystreets_python_sdk.us_street import Candidate
from smartystreets_python_sdk import Batch
from smartystreets_python_sdk.us_street import Lookup as StreetLookup
from smartystreets_python_sdk.us_street.client import Client as USStreetClient
from smartystreets_python_sdk.us_street.match_type import MatchType
from aio_pika import IncomingMessage, Channel
from dotenv import load_dotenv
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from sqlalchemy.orm.exc import StaleDataError

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from db_dependencies import Db
from resolver import Resolver
from config.sentry import SentryConfig
from sqlalchemy.dialects.postgresql import insert
from models.audience_smarts import AudienceSmart
from utils import send_sse
from models.audience_smarts_persons import AudienceSmartPerson
from models.audience_postals_verification import AudiencePostalVerification
from persistence.user_persistence import UserPersistence
from services.audience_smarts import AudienceSmartsService
from config.rmq_connection import (
    RabbitMQConnection,
    publish_rabbitmq_message_with_channel,
)

load_dotenv()

AUDIENCE_VALIDATION_AGENT_POSTAL = "aud_validation_agent_postal"
AUDIENCE_VALIDATION_PROGRESS = "AUDIENCE_VALIDATION_PROGRESS"
AUDIENCE_VALIDATION_FILLER = "aud_validation_filler"

COLUMN_MAPPING = {
    "cas_home_address": "cas_home_address",
    "cas_office_address": "cas_office_address",
}

AUTH_ID = os.getenv("SMARTY_AUTH_ID")
AUTH_TOKEN = os.getenv("SMARTY_AUTH_TOKEN")

builder = ClientBuilder(StaticCredentials(AUTH_ID, AUTH_TOKEN))

builder.max_retries = 0

SMARTY_CLIENT: USStreetClient = builder.build_us_street_api_client()

batc = Batch()

BATCH_LIMIT = 100


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


_WHITESPACE = re.compile(r"\s+")


def _norm(text: str) -> str:
    return _WHITESPACE.sub(" ", text).strip().casefold()


def verify_address(
    candidates: List[Candidate],
    req_street: str,
    req_city: str,
    req_state: str,
) -> bool:
    want_street = _norm(req_street)
    want_city = _norm(req_city)
    want_state = _norm(req_state)

    for c in candidates:
        full = _norm(f"{c.delivery_line_1} {c.last_line}")
        logging.info(f"full result: {full}")
        if want_city in full and want_state in full and want_street in full:
            return True
    return False


def chunked_iterable(iterable, size):
    it = iter(iterable)
    for first in it:
        yield [first] + list(islice(it, size - 1))


async def process_rmq_message(
    message: IncomingMessage,
    db_session: Session,
    channel: Channel,
    user_persistence: UserPersistence,
    audience_smarts_service: AudienceSmartsService,
):
    try:
        message_body = json.loads(message.body)
        user_id = message_body.get("user_id")
        aud_smart_id = message_body.get("aud_smart_id")
        batch = message_body.get("batch")
        count_persons_before_validation = message_body.get(
            "count_persons_before_validation"
        )
        validation_type = message_body.get("validation_type")
        validation_cost = message_body.get("validation_cost")
        logging.info(
            f"[START] Validation for aud_smart_id={aud_smart_id}, type={validation_type}"
        )
        failed_ids = []
        verifications = []
        write_off_funds = Decimal(0)
        count_subtracted = Decimal(0)

        smarty_lookups = []
        lookup_by_person_id = {}

        for record in batch:
            person_id = record["audience_smart_person_id"]
            street, city, state, zipcode = (
                record.get("address", ""),
                record.get("city", ""),
                record.get("state_name", ""),
                record.get("postal_code", ""),
            )

            logging.debug(
                f"[RECORD] {person_id}: {zipcode} {state} {city} {street}"
            )

            if not (street and city and state and zipcode):
                failed_ids.append(person_id)
                logging.warning(
                    f"[SKIP] Missing fields for person_id={person_id}"
                )
                continue

            write_off_funds += Decimal(validation_cost)

            existing = (
                db_session.query(AudiencePostalVerification)
                .filter_by(postal_code=zipcode)
                .first()
            )
            if existing:
                logging.info(
                    f"[CACHE HIT] Postal {zipcode} already in DB (verified={existing.is_verified})"
                )
                if not existing.is_verified:
                    failed_ids.append(person_id)
                continue

            lookup = StreetLookup()
            lookup.input_id = str(person_id)
            lookup.street = street
            lookup.city = city
            lookup.state = state
            lookup.zipcode = zipcode
            lookup.candidates = 5
            lookup.match = MatchType.INVALID

            smarty_lookups.append(lookup)
            lookup_by_person_id[person_id] = lookup

        for chunk_idx, chunk in enumerate(
            chunked_iterable(smarty_lookups, BATCH_LIMIT), start=1
        ):
            logging.info(
                f"[BATCH] Sending chunk {chunk_idx} with {len(chunk)} lookups"
            )

            batch_obj = Batch()
            for lookup in chunk:
                batch_obj.add(lookup)

            try:
                SMARTY_CLIENT.send_batch(batch_obj)
            except smarty_exc.SmartyException as err:
                logging.error(f"[SMARTY ERROR] Chunk {chunk_idx}: {err}")
                failed_ids.extend([l.input_id for l in chunk])
                continue

            for lookup in chunk:
                candidates = lookup.result
                logging.info(
                    f"[RESULT] {lookup.zipcode}: {len(candidates)} candidates"
                )

                is_ok = verify_address(
                    candidates, lookup.street, lookup.city, lookup.state
                )
                logging.debug(f"[VERIFY] {lookup.input_id} -> {is_ok}")

                verifications.append(
                    {"postal_code": lookup.zipcode, "is_verified": is_ok}
                )
                if not is_ok:
                    failed_ids.append(lookup.input_id)

        success_ids = [
            rec["audience_smart_person_id"]
            for rec in batch
            if rec["audience_smart_person_id"] not in failed_ids
        ]
        logging.info(
            f"[STATS] Success={len(success_ids)}, Failed={len(failed_ids)}"
        )

        if write_off_funds:
            count_subtracted = user_persistence.deduct_validation_funds(
                user_id, write_off_funds
            )
            db_session.flush()

        if verifications:
            stmt = insert(AudiencePostalVerification).values(verifications)
            stmt = stmt.on_conflict_do_update(
                index_elements=["postal_code"],
                set_={"is_verified": stmt.excluded.is_verified},
            )

            db_session.execute(stmt)
            db_session.commit()

        logging.info(f"failed_ids len: {len(failed_ids)}")

        if failed_ids:
            db_session.bulk_update_mappings(
                AudienceSmartPerson,
                [
                    {
                        "id": pid,
                        "is_validation_processed": False,
                        "is_valid": False,
                    }
                    for pid in failed_ids
                ],
            )
            db_session.flush()

        if success_ids:
            db_session.bulk_update_mappings(
                AudienceSmartPerson,
                [
                    {"id": pid, "is_validation_processed": False}
                    for pid in success_ids
                ],
            )
            db_session.flush()

        db_session.commit()
        total_validated = db_session.scalar(
            select(func.count(AudienceSmartPerson.id)).where(
                AudienceSmartPerson.smart_audience_id == aud_smart_id,
                AudienceSmartPerson.is_valid.is_(True),
            )
        )
        logging.info(
            f"[FINAL] Total validated for audience {aud_smart_id}: {total_validated}"
        )
        validation_count = db_session.scalar(
            select(func.count(AudienceSmartPerson.id)).where(
                AudienceSmartPerson.smart_audience_id == aud_smart_id,
                AudienceSmartPerson.is_validation_processed.is_(False),
            )
        )
        total_count = (
            db_session.query(AudienceSmartPerson)
            .filter(AudienceSmartPerson.smart_audience_id == aud_smart_id)
            .count()
        )

        aud_smart = db_session.get(AudienceSmart, aud_smart_id)
        validations = {}

        if aud_smart and aud_smart.validations:
            validations = json.loads(aud_smart.validations)
            key = COLUMN_MAPPING.get(validation_type)

            for cat in validations.values():
                for rule in cat:
                    if key in rule:
                        rule[key].setdefault("count_cost", "0.00")

                        rule[key]["count_validated"] = total_validated
                        rule[key]["count_submited"] = (
                            count_persons_before_validation
                        )

                        previous_cost = Decimal(rule[key]["count_cost"])
                        rule[key]["count_cost"] = str(
                            (previous_cost + count_subtracted).quantize(
                                Decimal("0.01")
                            )
                        )

                        if validation_count == total_count:
                            rule[key]["processed"] = True

            aud_smart.validations = json.dumps(validations)

        db_session.commit()

        if validation_count == total_count:
            audience_smarts_service.update_stats_validations(
                validation_type=f"postal_cas_verification-{validation_type}",
                count_persons_before_validation=count_persons_before_validation,
                count_valid_persons=total_validated,
            )
            db_session.commit()
            await publish_rabbitmq_message_with_channel(
                channel=channel,
                queue_name=AUDIENCE_VALIDATION_FILLER,
                message_body={
                    "aud_smart_id": str(aud_smart_id),
                    "user_id": user_id,
                    "validation_params": validations,
                },
            )

        await send_sse(
            channel=channel,
            user_id=user_id,
            data={
                "smart_audience_id": aud_smart_id,
                "total_validated": total_validated,
            },
        )
        logging.info("sent sse with total count")

        await message.ack()

    except StaleDataError:
        logging.warning(f"AudienceSmart {aud_smart_id} not found; skipping.")
        db_session.rollback()
        await message.ack()

    except Exception as e:
        logging.error(f"Error processing matching: {e}", exc_info=True)
        await message.reject(requeue=True)
        return


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
            logging.info("Starting processing...")
            rmq_connection = RabbitMQConnection()
            connection = await rmq_connection.connect()
            channel = await connection.channel()
            await channel.set_qos(prefetch_count=1)

            db_session = await resolver.resolve(Db)
            audience_smarts_service = await resolver.resolve(
                AudienceSmartsService
            )
            user_persistence = UserPersistence(db_session)

            queue = await channel.declare_queue(
                name=AUDIENCE_VALIDATION_AGENT_POSTAL,
                durable=True,
            )
            await queue.consume(
                functools.partial(
                    process_rmq_message,
                    channel=channel,
                    db_session=db_session,
                    user_persistence=user_persistence,
                    audience_smarts_service=audience_smarts_service,
                )
            )

            await asyncio.Future()

        except Exception as e:
            logging.error("Unhandled Exception:", exc_info=True)
            await SentryConfig.capture(e)
            if db_session:
                logging.info("Closing the database session...")
                db_session.close()
            if rmq_connection:
                logging.info("Closing RabbitMQ connection...")
                await rmq_connection.close()
            logging.info("Shutting down...")
            time.sleep(10)


if __name__ == "__main__":
    asyncio.run(main())
