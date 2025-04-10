import logging
import os
import sys
import asyncio
import functools
import json
import pytz
from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Union, Optional
import boto3
from sqlalchemy import update, func
from aio_pika import IncomingMessage, Connection
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

from models.five_x_five_emails import FiveXFiveEmails

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from models.five_x_five_users_emails import FiveXFiveUsersEmails
from models.five_x_five_users import FiveXFiveUser
from enums import TypeOfCustomer, ProccessDataSyncResult, EmailType
from utils import get_utc_aware_date, get_valid_email_without_million
from models.leads_visits import LeadsVisits
from models.emails import Email
from models.emails_enrichment import EmailEnrichment
from models.leads_users import LeadUser
from schemas.scripts.audience_source import PersonEntry, MessageBody, DataBodyNormalize, PersonRow, DataForNormalize, DataBodyFromSource
from services.audience_sources import AudienceSourceMath
from models.audience_sources import AudienceSource
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message

load_dotenv()

AUDIENCE_SOURCES_MATCHING = 'aud_sources_matching'
SOURCE_PROCESSING_PROGRESS = "SOURCE_PROCESSING_PROGRESS"
BATCH_SIZE = 500
DATE_LIMIT = 180


def setup_logging(level):
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )


def create_sts_client(key_id, key_secret):
    return boto3.client(
        'sts',
        aws_access_key_id=key_id,
        aws_secret_access_key=key_secret,
        region_name='us-east-2'
    )


def assume_role(role_arn, sts_client):
    credentials = sts_client.assume_role(
        RoleArn=role_arn,
        RoleSessionName="create-use-assume-role-scenario"
    )['Credentials']
    logging.info(f"Assumed role '{role_arn}', got temporary credentials.")
    return credentials


async def send_sse(connection, user_id: int, data: dict):
    try:
        print(f"userd_id = {user_id}")
        logging.info(f"send client throught SSE: {data, user_id}")
        await publish_rabbitmq_message(
            connection=connection,
            queue_name=f'sse_events_{str(user_id)}',
            message_body={
                "status": SOURCE_PROCESSING_PROGRESS,
                "data": data
            }
        )
    except Exception as e:
        logging.error(f"Error sending SSE: {e}")


async def process_email_leads(
    persons: List[PersonRow], db_session: Session, source_id: str, include_amount: bool = False, date_range: Optional[int] = None
) -> int:

    matched_persons = defaultdict(lambda: {
        "orders_amount": 0.0 if include_amount else None,
        "orders_count": 0,
        "start_date": None,
        "enrichment_user_id": None
    })

    logging.info(f"Start processing {len(persons)} persons for source_id {source_id}")

    emails = {p.email.strip().lower() for p in persons if p.email}
    if not emails:
        logging.info("No valid emails found in input data.")
        return 0
    
    email_records = db_session.query(Email).filter(Email.email.in_(emails)).all()
    
    if not email_records:
        logging.info("No matching emails found in FiveXFiveEmails table.")
        return 0

    email_to_id = {record.email: record.id for record in email_records}

    email_ids = list(email_to_id.values())
    user_records = db_session.query(EmailEnrichment.email_id, EmailEnrichment.enrichment_user_id).filter(
        EmailEnrichment.email_id.in_(email_ids)
    ).all()

    email_id_to_user_id = {record.email_id: record.enrichment_user_id for record in user_records}

    email_to_user_id = {email: email_id_to_user_id[email_id] for email, email_id in email_to_id.items() if
                        email_id in email_id_to_user_id}

    filtered_persons = [p for p in persons if p.email.strip().lower() in email_to_user_id]
    if not filtered_persons:
        logging.info("No valid persons left after filtering by existing emails.")
        return 0

    for person in filtered_persons:
        email = (person.email or "").strip().lower()
        transaction_date = (person.date or "").strip()

        transaction_date_obj = None
        if transaction_date:
            try:
                transaction_date_obj = datetime.fromisoformat(transaction_date)
            except Exception as date_error:
                logging.warning(f"Error parsing date '{transaction_date}': {date_error}")

        if date_range and transaction_date_obj and transaction_date_obj < (datetime.now() - timedelta(days=date_range)):
            continue

        sale_amount = Decimal(person.sale_amount) if include_amount and person.sale_amount is not None else Decimal(
            "0.0")

        if email in matched_persons:
            matched_persons[email]["orders_count"] += 1
            if include_amount:
                matched_persons[email]["orders_amount"] += sale_amount
            if transaction_date_obj:
                existing_date = matched_persons[email]["start_date"]
                if existing_date is None or transaction_date_obj > existing_date:
                    matched_persons[email]["start_date"] = transaction_date_obj
                    logging.debug(f"Updated start_date for {email}: {transaction_date_obj}")
        else:
            matched_persons[email] = {
                "orders_count": 1,
                "start_date": transaction_date_obj,
                "enrichment_user_id": email_to_user_id[email]
            }
            if include_amount:
                matched_persons[email]["orders_amount"] = sale_amount
            logging.debug(
                f"Added new person {email} with sale amount {sale_amount} and transaction date {transaction_date_obj}")

    existing_persons = {p.email: p for p in db_session.query(AudienceSourcesMatchedPerson).filter(
        AudienceSourcesMatchedPerson.source_id == source_id,
        AudienceSourcesMatchedPerson.email.in_(matched_persons.keys())
    ).all()}

    logging.info(f"Found {len(existing_persons)} existing persons to update for source_id {source_id}")

    reference_date = datetime.now()

    matched_persons_to_update = []
    matched_persons_to_add = []
    for email, data in matched_persons.items():
        last_transaction = data["start_date"]
        recency = (reference_date - last_transaction).days if last_transaction else None

        if email in existing_persons:
            matched_person = existing_persons[email]
            matched_person.count += data["orders_count"]
            if include_amount:
                matched_person.count += data["orders_amount"]

            if data["start_date"]:
                if matched_person.start_date is None or data["start_date"] > matched_person.start_date:
                    matched_person.start_date = data["start_date"]
                    matched_person.recency = recency
                    logging.debug(f"Updated matched person {email}: orders_count={matched_person.count}")

            matched_persons_to_update.append({
                "id": matched_person.id,
                "amount": matched_person.amount if include_amount else 0.0,
                "count": matched_person.count,
                "start_date": matched_person.start_date,
                "recency": recency
            })
        else:
            new_matched_person = AudienceSourcesMatchedPerson(
                source_id=source_id,
                email=email,
                count=data["orders_count"],
                start_date = data["start_date"],
                recency=recency,
                enrichment_user_id=data["enrichment_user_id"]
            )
            if include_amount:
                new_matched_person.amount = data["orders_amount"]

            matched_persons_to_add.append(new_matched_person)
            logging.debug(f"Added new matched person {email}: orders_count={data['orders_count']}")

    if matched_persons_to_update:
        logging.info(f"Updating {len(matched_persons_to_update)} persons in the database")
        db_session.bulk_update_mappings(AudienceSourcesMatchedPerson, matched_persons_to_update)

    if matched_persons_to_add:
        logging.info(f"Adding {len(matched_persons_to_add)} new persons to the database")
        db_session.bulk_save_objects(matched_persons_to_add)

    return len(matched_persons_to_add)

async def process_email_customer_conversion(persons: List[PersonRow], db_session: Session, source_id: str) -> int:
    return await process_email_leads(persons, db_session, source_id, include_amount=True)

async def process_email_failed_leads(persons: List[PersonRow], db_session: Session, source_id: str) -> int:
    return await process_email_leads(persons, db_session, source_id, include_amount=False)

def calculate_website_visitor_user_value(first_datetime, last_start_datetime, last_end_datetime):    
    reference_date = get_utc_aware_date()
    first_datetime = first_datetime.astimezone(pytz.utc)
    last_start_datetime = last_start_datetime.astimezone(pytz.utc)
    last_end_datetime = last_end_datetime.astimezone(pytz.utc)
    recency = (reference_date - last_start_datetime).days
    recency_min = Decimal((reference_date - first_datetime).days)
    recency_max = Decimal((reference_date - last_end_datetime).days)
    
    inverted_recency = AudienceSourceMath.inverted_decimal(value=recency) if recency > 0 else 0
    inverted_recency_min = AudienceSourceMath.inverted_decimal(value=recency_min) if recency_min > 0 else 0
    inverted_recency_max = AudienceSourceMath.inverted_decimal(value=recency_max) if recency_max > 0 else 0
    
    recency_score = AudienceSourceMath.normalize_decimal(value=inverted_recency, min_val=inverted_recency_min, max_val=inverted_recency_max, coefficient=Decimal(0.5))
    
    duration_minutes = Decimal((last_end_datetime - last_start_datetime).total_seconds()) / Decimal(60)

    page_view_score = 0.0
    if duration_minutes >= 2:
        page_view_score = 0.5
    elif duration_minutes >= 1:
        page_view_score = 0.25
    else:
        page_view_score = 0.0


    user_value_score = Decimal(recency_score) + Decimal(page_view_score)
    return {
        "recency":recency,
        "recency_min": recency_min,
        "recency_max": recency_max,
        "inverted_recency": inverted_recency,
        "inverted_recency_min": inverted_recency_min,
        "inverted_recency_max": inverted_recency_max,
        "active_end_date": last_end_datetime,
        "active_start_date": last_start_datetime,
        "duration": duration_minutes,
        "recency_score": recency_score,
        "page_view_score": page_view_score,
        "user_value_score": user_value_score
    }

async def process_email_interest_leads(persons: List[PersonRow], db_session: Session, source_id: str) -> int:
    return await process_email_leads(persons, db_session, source_id, include_amount=False, date_range=90)

async def process_user_id(persons: List[PersonRow], db_session: Session, source_id: str, audience_source: AudienceSource) -> int:
    five_x_five_user_ids = [p.user_id for p in persons]
    logging.info(f"user_ids find {len(five_x_five_user_ids)} for source_id {source_id}")

    results_query = (
        db_session.query(
            LeadUser.id,
            FiveXFiveUser.id.label("five_x_five_user_id")
        )
        .join(FiveXFiveUser, FiveXFiveUser.id == LeadUser.five_x_five_user_id)
        .filter(
            LeadUser.user_id == audience_source.user_id,
            FiveXFiveUser.id.in_(five_x_five_user_ids)
        )
        .all()
    )

    updates = []
    for lead_id, five_x_five_user_id in results_query:
        email_types_priority = [EmailType.BUSINESS, EmailType.PERSONAL, EmailType.ADDITIONAL_PERSONAL]
        email = None
        enrichment_user_id = None
        for email_type in email_types_priority:
            email_link = db_session.query(FiveXFiveUsersEmails.email_id).filter_by(
                user_id=five_x_five_user_id,
                type=email_type.value
            ).first()
            if not email_link:
                continue

            email_entry = db_session.query(FiveXFiveEmails.email).filter_by(
                id=email_link.email_id
            ).first()
            if not email_entry:
                continue

            email = email_entry[0]
            enrichment_email_id = db_session.query(Email.id).filter_by(email=email).first()
            if not enrichment_email_id:
                continue

            enrichment_user_id = db_session.query(EmailEnrichment.enrichment_user_id).filter_by(
                email_id=enrichment_email_id.id
            ).first()

            if enrichment_user_id:
                enrichment_user_id = enrichment_user_id[0]
                break

        if not enrichment_user_id:
            continue

        first_visit = db_session.query(LeadsVisits).filter(
            LeadsVisits.lead_id == lead_id
        ).order_by(
            LeadsVisits.end_date.asc(), LeadsVisits.end_time.asc()
        ).first()
        last_visit = db_session.query(LeadsVisits).filter(
            LeadsVisits.lead_id == lead_id
        ).order_by(
            LeadsVisits.end_date.desc(), LeadsVisits.end_time.desc()
        ).first()

        first_datetime = datetime.combine(first_visit.end_date, first_visit.end_time)
        last_start_datetime = datetime.combine(last_visit.start_date, last_visit.start_time)
        last_end_datetime = datetime.combine(last_visit.end_date, last_visit.end_time)

        calculate_result = calculate_website_visitor_user_value(first_datetime, last_start_datetime, last_end_datetime)

        updates.append({
            "source_id": source_id,
            "enrichment_user_id": enrichment_user_id,
            "email": email,
            "start_date": calculate_result['active_start_date'],
            "end_date": calculate_result['active_end_date'],
            "recency": calculate_result['recency'],
            "recency_min": calculate_result['recency_min'],
            "recency_max": calculate_result['recency_max'],
            "inverted_recency": calculate_result['inverted_recency'],
            "inverted_recency_min": calculate_result['inverted_recency_min'],
            "inverted_recency_max": calculate_result['inverted_recency_max'],
            "duration": calculate_result['duration'],
            "recency_score": calculate_result['recency_score'],
            "view_score": calculate_result['page_view_score'],
            "value_score": calculate_result['user_value_score'],
        })

    if updates:
        db_session.bulk_insert_mappings(AudienceSourcesMatchedPerson, updates)
        logging.info(f"Updated {len(updates)} persons.")
        db_session.commit()

    return len(updates)



async def process_and_send_chunks(db_session: Session, source_id: str, batch_size: int, queue_name: str,
                                  connection, status: str):
    result = db_session.query(
        func.min(AudienceSourcesMatchedPerson.amount).label('min_orders_amount'),
        func.max(AudienceSourcesMatchedPerson.amount).label('max_orders_amount'),
        func.min(AudienceSourcesMatchedPerson.count).label('min_orders_count'),
        func.max(AudienceSourcesMatchedPerson.count).label('max_orders_count'),
        func.min(AudienceSourcesMatchedPerson.recency).label('min_recency'),
        func.max(AudienceSourcesMatchedPerson.recency).label('max_recency'),
        func.min(AudienceSourcesMatchedPerson.start_date).label('min_start_date'),
        func.max(AudienceSourcesMatchedPerson.start_date).label('max_start_date'),
        func.count().label('total_count')
    ).filter(
        AudienceSourcesMatchedPerson.source_id == source_id,
        AudienceSourcesMatchedPerson.amount.isnot(None),
        AudienceSourcesMatchedPerson.count.isnot(None),
        AudienceSourcesMatchedPerson.recency.isnot(None),
        AudienceSourcesMatchedPerson.start_date.isnot(None)
    ).first()
    
    min_orders_amount = float(result.min_orders_amount) if result.min_orders_amount is not None else 0.0
    max_orders_amount = float(result.max_orders_amount) if result.max_orders_amount is not None else 1.0
    min_orders_count = int(result.min_orders_count or 0)
    max_orders_count = int(result.max_orders_count or 1)
    min_recency = float(result.min_recency) if result.min_recency is not None else 0.0
    max_recency = float(result.max_recency) if result.max_recency is not None else 1.0
    min_start_date = result.min_start_date
    max_start_date = result.max_start_date
    total_count = int(result.total_count or 0)

    logging.info(f"Processing {result}")

    for offset in range(0, total_count, batch_size):
        matched_persons_list = db_session.query(AudienceSourcesMatchedPerson) \
            .filter_by(source_id=source_id) \
            .offset(offset) \
            .limit(batch_size) \
            .all()

        if not matched_persons_list:
            logging.warning(f"No more matched persons found for source_id {source_id} at offset {offset}")
            break

        logging.info(f"Processing {len(matched_persons_list)} matched persons for source_id {source_id}")

        batch_rows: List[PersonEntry] = [
            PersonEntry(
                id=str(p.id),
                email=str(p.email),
                sum_amount=float(p.amount) if p.amount is not None else 0.0,
                count=int(p.count),
                recency=float(p.recency) if p.recency is not None else 0.0
            )
            for p in matched_persons_list
        ]

        message_body = MessageBody(
            type="emails",
            data=DataBodyNormalize(
                persons=batch_rows,
                source_id=source_id,
                data_for_normalize=DataForNormalize(
                    matched_size=offset + len(batch_rows),
                    all_size=total_count,
                    min_amount=min_orders_amount,
                    max_amount=max_orders_amount,
                    min_count=min_orders_count,
                    max_count=max_orders_count,
                    min_start_date=min_start_date.isoformat() if min_start_date else None,
                    max_start_date=max_start_date.isoformat() if max_start_date else None,
                    min_recency=min_recency,
                    max_recency=max_recency,
                ),
            ),
            status=status
        )

        await publish_rabbitmq_message(connection=connection, queue_name=queue_name, message_body=message_body)
        logging.info(f"RMQ message sent for batch starting at offset {offset} of size {total_count}")

    logging.info(f"All chunks processed and messages sent for source_id {source_id}")

async def normalize_persons_customer_conversion(
    persons: List[PersonEntry], source_id: str, data_for_normalize: DataForNormalize, db_session: Session
):
    logging.info(f"Processing normalization data for source_id {source_id}")

    min_orders_amount = Decimal(str(data_for_normalize.min_amount)) if data_for_normalize.min_amount is not None else Decimal("0.0")
    max_orders_amount = Decimal(str(data_for_normalize.max_amount)) if data_for_normalize.max_amount is not None else Decimal("1.0")
    min_orders_count = Decimal(str(data_for_normalize.min_count))
    max_orders_count = Decimal(str(data_for_normalize.max_count))
    min_recency = Decimal(str(data_for_normalize.min_recency)) if data_for_normalize.min_recency is not None else Decimal("0.0")
    max_recency = Decimal(str(data_for_normalize.max_recency)) if data_for_normalize.max_recency is not None else Decimal("1.0")

    updates = []

    for person in persons:
        if person.sum_amount is None:
            logging.warning(f"Missing orders_amount for person with id {person.id}")
            orders_amount = Decimal("0.0")
        else:
            orders_amount = Decimal(str(person.sum_amount))

        if person.count is None:
            logging.warning(f"Missing orders_count for person with id {person.id}")
            orders_count = Decimal("0.0")
        else:
            orders_count = Decimal(str(person.count))

        if person.recency is None:
            logging.warning(f"Missing recency for person with id {person.id}")
            recency = Decimal("0.0")
        else:
            recency = Decimal(str(person.recency))

        recency_normalized = AudienceSourceMath.normalize_decimal(value=recency, min_val=min_recency, max_val=max_recency)
        orders_count_normalized = AudienceSourceMath.normalize_decimal(value=orders_count, min_val=min_orders_count, max_val=max_orders_count)
        orders_amount_normalized = AudienceSourceMath.normalize_decimal(value=orders_amount, min_val=min_orders_amount, max_val=max_orders_amount)

        value_score = AudienceSourceMath.weighted_score(
            first_data=orders_amount_normalized,
            second_data=orders_count_normalized,
            third_data=recency_normalized,
            w1=Decimal("1"),
            w2=Decimal("1"),
            w3=Decimal("1"),
            correction=Decimal("1")
        )

        updates.append({
            'id': person.id,
            'source_id': source_id,
            'email': person.email,
            'amount_min': min_orders_amount,
            'amount_max': max_orders_amount,
            'count_min': min_orders_count,
            'count_max': max_orders_count,
            'recency_min': min_recency,
            'recency_max': max_recency,
            'recency_score': recency_normalized,
            'view_score':orders_count_normalized,
            'sum_score': orders_amount_normalized,
            'value_score': value_score,
        })

    if updates:
        db_session.bulk_update_mappings(AudienceSourcesMatchedPerson, updates)
        logging.info(f"Updated {len(updates)} persons.")

    db_session.commit()

    logging.info(
        f"RMQ message sent for matched records {data_for_normalize.matched_size} matched persons "
        f"from {data_for_normalize.all_size} matched records."
    )

async def normalize_persons_interest_leads(
    persons: List[PersonEntry], source_id: str, data_for_normalize: DataForNormalize, db_session: Session
):
    import logging
    logging.info(f"Processing normalization data for source_id {source_id}")

    min_recency = Decimal(
        str(data_for_normalize.min_recency)) if data_for_normalize.min_recency is not None else Decimal("0.0")
    max_recency = Decimal(
        str(data_for_normalize.max_recency)) if data_for_normalize.max_recency is not None else Decimal("1.0")
    inverted_min_recency = AudienceSourceMath.inverted_decimal(value=min_recency)
    inverted_max_recency = AudienceSourceMath.inverted_decimal(value=max_recency)
    if inverted_min_recency > inverted_max_recency:
        inverted_min_recency, inverted_max_recency = inverted_max_recency, inverted_min_recency
    min_count = Decimal(str(data_for_normalize.min_count))
    max_count = Decimal(str(data_for_normalize.max_count))

    logging.info(f"Inverted recency bounds: {inverted_min_recency} {inverted_max_recency}")

    updates = []

    for person in persons:
        current_recency = Decimal(str(person.recency)) if person.recency is not None else Decimal("0.0")
        inverted_recency = AudienceSourceMath.inverted_decimal(value=current_recency)
        recency_normalized = AudienceSourceMath.normalize_decimal(value=inverted_recency, min_val=inverted_min_recency, max_val=inverted_max_recency, coefficient=Decimal("0.5"))

        orders_count = Decimal(str(person.count))
        orders_count_score = AudienceSourceMath.normalize_decimal(value=orders_count, min_val=min_count, max_val=max_count, coefficient=Decimal("0.5"))

        user_value_score = recency_normalized + orders_count_score

        if user_value_score < Decimal("0.0") or user_value_score > Decimal("1.0"):
            logging.warning(f"UserValueScore for person {person.id} out of bounds: {user_value_score}")

        updates.append({
            'id': person.id,
            'source_id': source_id,
            'email': person.email,
            'count_min': min_count,
            'count_max': max_count,
            'recency_min': min_recency,
            'recency_max': max_recency,
            'inverted_recency': inverted_recency,
            'inverted_recency_max': inverted_max_recency,
            'inverted_recency_min': inverted_min_recency,
            'view_score': orders_count_score,
            'recency_score': recency_normalized,
            'value_score': user_value_score,
        })

    if updates:
        db_session.bulk_update_mappings(AudienceSourcesMatchedPerson, updates)
        logging.info(f"Updated {len(updates)} persons.")

    db_session.commit()

    logging.info(
        f"RMQ message sent for matched records {data_for_normalize.matched_size} matched persons "
        f"from {data_for_normalize.all_size} matched records."
    )
    
async def normalize_persons_failed_leads(
    persons: List[PersonEntry], source_id: str, data_for_normalize: DataForNormalize, db_session: Session
):
    logging.info(f"Processing normalization data for source_id {source_id}")

    min_recency = Decimal(
        str(data_for_normalize.min_recency)) if data_for_normalize.min_recency is not None else Decimal("0.0")
    max_recency = Decimal(
        str(data_for_normalize.max_recency)) if data_for_normalize.max_recency is not None else Decimal("1.0")
    inverted_min_recency = AudienceSourceMath.inverted_decimal(value=min_recency)
    inverted_max_recency = AudienceSourceMath.inverted_decimal(value=max_recency)
    if inverted_min_recency > inverted_max_recency:
        inverted_min_recency, inverted_max_recency = inverted_max_recency, inverted_min_recency

    logging.info(f"Inverted recency bounds: {inverted_min_recency} {inverted_max_recency}")

    updates = []

    for person in persons:
        current_recency = Decimal(str(person.recency)) if person.recency is not None else Decimal("0.0")
        inverted_recency = AudienceSourceMath.inverted_decimal(current_recency)
        value_score = AudienceSourceMath.normalize_decimal(value=inverted_recency, min_val=inverted_min_recency, max_val=inverted_max_recency)

        updates.append({
            'id': person.id,
            'source_id': source_id,
            'email': person.email,
            'recency_min': min_recency,
            'recency_max': max_recency,
            'inverted_recency': inverted_recency,
            'inverted_recency_min': inverted_min_recency,
            'inverted_recency_max': inverted_max_recency,
            'recency_score': value_score,
            'value_score': value_score,
        })

    if updates:
        db_session.bulk_update_mappings(AudienceSourcesMatchedPerson, updates)
        logging.info(f"Updated {len(updates)} persons.")

    db_session.commit()

    logging.info(
        f"RMQ message sent for matched records {data_for_normalize.matched_size} matched persons "
        f"from {data_for_normalize.all_size} matched records."
    )

async def aud_sources_matching(message: IncomingMessage, db_session: Session, connection: Connection):
    try:
        message_body_dict = json.loads(message.body)
        message_body = MessageBody(**message_body_dict)
        data: Union[DataBodyNormalize, DataBodyFromSource] = message_body.data
        source_id: str = data.source_id
        audience_source = db_session.query(AudienceSource).filter_by(id=source_id).first()

        if not data or not audience_source:
            logging.warning("Message data is missing or audience source not found.")
            await message.ack()
            return

        type: str = message_body.type
        persons: Union[List[PersonRow], List[PersonEntry]] = data.persons
        data_for_normalize: Optional[DataForNormalize] = (
            data.data_for_normalize if isinstance(data, DataBodyNormalize) else None
        )

        if type == 'emails' and data_for_normalize:
            if message_body.status == TypeOfCustomer.CUSTOMER_CONVERSIONS.value:
                await normalize_persons_customer_conversion(persons=persons, source_id=source_id, data_for_normalize=data_for_normalize,
                                                            db_session=db_session)

            if message_body.status == TypeOfCustomer.FAILED_LEADS.value:
                await normalize_persons_failed_leads(persons=persons, source_id=source_id, data_for_normalize=data_for_normalize,
                                                            db_session=db_session)

            if message_body.status == TypeOfCustomer.INTEREST.value:
                await normalize_persons_interest_leads(persons=persons, source_id=source_id, data_for_normalize=data_for_normalize,
                                                            db_session=db_session)

            await message.ack()
            return

        count = 0

        user_id = data.user_id

        if type == 'user_ids':
            logging.info(f"Processing {len(persons)} user_id records.")
            count = await process_user_id(persons=persons, db_session=db_session, source_id=source_id,
                                          audience_source=audience_source)

        if type == 'emails':
            if message_body.status == TypeOfCustomer.CUSTOMER_CONVERSIONS.value:
                logging.info(f"Processing {len(persons)} customer conversions.")
                count = await process_email_customer_conversion(persons=persons, db_session=db_session, source_id=source_id)

            if message_body.status == TypeOfCustomer.FAILED_LEADS.value:
                logging.info(f"Processing {len(persons)} failed lead records.")
                count = await process_email_failed_leads(persons=persons, db_session=db_session, source_id=source_id)
                
            if message_body.status == TypeOfCustomer.INTEREST.value:
                logging.info(f"Processing {len(persons)} interest lead records.")
                count = await process_email_interest_leads(persons=persons, db_session=db_session, source_id=source_id)

        logging.info(f"Updated processed and matched records for source_id {count}.")

        total_records, processed_records, matched_records = db_session.execute(
            update(AudienceSource)
            .where(AudienceSource.id == source_id)
            .values(
                matched_records=AudienceSource.matched_records + count,
                processed_records=AudienceSource.processed_records + len(persons)
            )
            .returning(AudienceSource.total_records, AudienceSource.processed_records, AudienceSource.matched_records)
        ).fetchone()

        db_session.flush()
        logging.info(f"Updated processed and matched records for source_id {source_id}.")

        if processed_records >= total_records:
            db_session.execute(
                update(AudienceSource)
                .where(AudienceSource.id == source_id)
                .values(matched_records_status="complete")
            )
            logging.info(f"Source_id {source_id} processing complete.")

        db_session.commit()

        if type == 'emails' and processed_records >= total_records:
            await process_and_send_chunks(db_session=db_session, source_id=source_id,
                                            batch_size=BATCH_SIZE, queue_name=AUDIENCE_SOURCES_MATCHING,
                                            connection=connection, status=message_body.status)

        await send_sse(connection, user_id,
                        {"source_id": source_id, "total": total_records, "processed": processed_records,
                        "matched": matched_records})

        await message.ack()
        logging.info(f"Processing completed for source_id {source_id}.")

    except BaseException as e:
        logging.warning(f"Message for source_id failed and will be reprocessed. {e}")
        db_session.rollback()
        await message.ack()


async def main():
    log_level = logging.INFO
    if len(sys.argv) > 1:
        arg = sys.argv[1].upper()
        if arg == 'DEBUG':
            log_level = logging.DEBUG
        elif arg != 'INFO':
            sys.exit("Invalid log level argument. Use 'DEBUG' or 'INFO'.")

    setup_logging(log_level)
    db_username = os.getenv('DB_USERNAME')
    db_password = os.getenv('DB_PASSWORD')
    db_host = os.getenv('DB_HOST')
    db_name = os.getenv('DB_NAME')

    try:
        logging.info("Starting processing...")
        rmq_connection = RabbitMQConnection()
        connection = await rmq_connection.connect()
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)

        engine = create_engine(
            f"postgresql://{db_username}:{db_password}@{db_host}/{db_name}", pool_pre_ping=True
        )
        Session = sessionmaker(bind=engine)
        db_session = Session()

        queue = await channel.declare_queue(
            name=AUDIENCE_SOURCES_MATCHING,
            durable=True,
        )
        await queue.consume(
            functools.partial(aud_sources_matching, connection=connection, db_session=db_session)
        )

        await asyncio.Future()

    except Exception:
        logging.error('Unhandled Exception:', exc_info=True)

    finally:
        if db_session:
            logging.info("Closing the database session...")
            db_session.close()
        if rmq_connection:
            logging.info("Closing RabbitMQ connection...")
            await rmq_connection.close()
        logging.info("Shutting down...")


if __name__ == "__main__":
    asyncio.run(main())
