import logging
import os
import sys
import asyncio
import functools
import json
import pytz
from uuid import UUID
from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Union, Optional, Any, Dict, Tuple
import boto3
from sqlalchemy import update, func
from aio_pika import IncomingMessage, Connection
from sqlalchemy import create_engine
from dataclasses import asdict
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

from models import EnrichmentUserContact

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from services.insightsUtils import InsightsUtils
from schemas.insights import InsightsByCategory, Personal, Financial, Lifestyle, Voter
from models.five_x_five_emails import FiveXFiveEmails
from models.five_x_five_users_emails import FiveXFiveUsersEmails
from models.five_x_five_users import FiveXFiveUser
from enums import TypeOfCustomer, EmailType, BusinessType
from utils import get_utc_aware_date
from models.leads_visits import LeadsVisits
from models.enrichment import EnrichmentUsersEmails, EnrichmentUser, EnrichmentFinancialRecord, EnrichmentLifestyle, \
    EnrichmentVoterRecord, EnrichmentPersonalProfiles, EnrichmentEmploymentHistory, EnrichmentProfessionalProfile
from models.enrichment.enrichment_emails import EnrichmentEmails
from models.leads_users import LeadUser
from schemas.scripts.audience_source import PersonEntry, MessageBody, DataBodyNormalize, PersonRow, DataForNormalize, DataBodyFromSource
from services.audience_sources import AudienceSourceMath
from models.audience_sources import AudienceSource
from models.audience_sources_matched_persons import AudienceSourcesMatchedPerson
from config.rmq_connection import RabbitMQConnection, publish_rabbitmq_message
from services.similar_audiences import SimilarAudienceService
from services.similar_audiences.audience_data_normalization import AudienceDataNormalizationService
from services.lookalikes import AudienceLookalikesService

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

    rows = (
        db_session.query(
            EnrichmentEmails.email,
            EnrichmentUser.id
        )
        .join(EnrichmentUsersEmails,
              EnrichmentEmails.id == EnrichmentUsersEmails.email_id)
        .join(EnrichmentUser,
              EnrichmentUsersEmails.enrichment_user_id == EnrichmentUser.id)
        .filter(EnrichmentEmails.email.in_(emails))
        .all()
    )

    if not rows:
        logging.info("No matching emails found in enrichment_emails.")
        return 0

    email_to_user_id = {email: user_id for email, user_id in rows}

    filtered_persons = [
        p for p in persons
        if p.email and p.email.strip().lower() in email_to_user_id
    ]
    if not filtered_persons:
        logging.info("No valid persons left after filtering by enrichment_emails.")
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

    db_session.commit()
    with db_session.begin():
        existing_persons = {
            p.email: p
            for p in (
                db_session
                .query(AudienceSourcesMatchedPerson)
                .filter(
                    AudienceSourcesMatchedPerson.source_id == source_id,
                    AudienceSourcesMatchedPerson.email.in_(matched_persons.keys())
                )
                .with_for_update()
                .all()
            )
        }

        logging.info(f"Found {len(existing_persons)} existing persons to update")

        reference_date = datetime.now()
        matched_persons_to_update = []
        matched_persons_to_add = []

        for email, data in matched_persons.items():
            last_transaction = data["start_date"]
            recency = ((reference_date - last_transaction).days
                       if last_transaction else None)

            if email in existing_persons:
                p = existing_persons[email]
                p.count += data["orders_count"]
                if include_amount:
                    p.amount += data["orders_amount"]
                if last_transaction and (
                    p.start_date is None or last_transaction > p.start_date
                ):
                    p.start_date = last_transaction
                    p.recency     = recency

                matched_persons_to_update.append({
                    "id":        p.id,
                    "count":     p.count,
                    "amount":    p.amount if include_amount else None,
                    "start_date": p.start_date,
                    "recency":   p.recency,
                })
            else:
                new_p = AudienceSourcesMatchedPerson(
                    source_id=source_id,
                    email=email,
                    count=data["orders_count"],
                    start_date=last_transaction,
                    recency=recency,
                    enrichment_user_id=data["enrichment_user_id"]
                )
                if include_amount:
                    new_p.amount = data["orders_amount"]

                matched_persons_to_add.append(new_p)

        if matched_persons_to_add:
            logging.info(f"Adding {len(matched_persons_to_add)} new persons")
            db_session.bulk_save_objects(matched_persons_to_add)

        if matched_persons_to_update:
            logging.info(f"Updating {len(matched_persons_to_update)} persons")
            db_session.bulk_update_mappings(
                AudienceSourcesMatchedPerson,
                matched_persons_to_update
            )

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

    with db_session.begin():
        existing_uids = {
            row[0]
            for row in db_session.query(AudienceSourcesMatchedPerson.enrichment_user_id)
            .filter(AudienceSourcesMatchedPerson.source_id == source_id)
            .all()
        }
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
        for lead_id, five_x_id in results_query:
            enrichment_user_id = None
            chosen_email = None
            for t in (EmailType.BUSINESS, EmailType.PERSONAL, EmailType.ADDITIONAL_PERSONAL):
                link_row = (
                    db_session.query(FiveXFiveUsersEmails.email_id)
                    .filter_by(user_id=five_x_id, type=t.value)
                    .first()
                )
                if not link_row:
                    continue

                email_id = link_row[0]

                email_row = (
                    db_session
                    .query(FiveXFiveEmails.email)
                    .filter_by(id=email_id)
                    .first()
                )
                if not email_row:
                    continue
                email = email_row[0]

                enrich_row = (
                    db_session
                    .query(EnrichmentUsersEmails.enrichment_user_id)
                    .join(EnrichmentEmails,
                          EnrichmentEmails.id == EnrichmentUsersEmails.email_id)
                    .filter(EnrichmentEmails.email == email)
                    .first()
                )
                if not enrich_row:
                    continue
                enrichment_user_id = enrich_row[0]
                chosen_email = email
                break

            if not enrichment_user_id or enrichment_user_id in existing_uids:
                continue

            first = db_session.query(LeadsVisits) \
                .filter_by(lead_id=lead_id) \
                .order_by(LeadsVisits.end_date, LeadsVisits.end_time) \
                .first()
            last = db_session.query(LeadsVisits) \
                .filter_by(lead_id=lead_id) \
                .order_by(LeadsVisits.end_date.desc(),
                          LeadsVisits.end_time.desc()) \
                .first()

            if not first or not last:
                continue

            fd = datetime.combine(first.end_date, first.end_time)
            ls = datetime.combine(last.start_date, last.start_time)
            le = datetime.combine(last.end_date, last.end_time)
            calc = calculate_website_visitor_user_value(fd, ls, le)

            updates.append({
                "source_id": source_id,
                "enrichment_user_id": enrichment_user_id,
                "email": chosen_email,
                "start_date": calc["active_start_date"],
                "end_date": calc["active_end_date"],
                "recency": calc["recency"],
                "recency_min": calc["recency_min"],
                "recency_max": calc["recency_max"],
                "inverted_recency": calc["inverted_recency"],
                "inverted_recency_min": calc["inverted_recency_min"],
                "inverted_recency_max": calc["inverted_recency_max"],
                "duration": calc["duration"],
                "recency_score": calc["recency_score"],
                "view_score": calc["page_view_score"],
                "value_score": calc["user_value_score"],
            })
            existing_uids.add(enrichment_user_id)

        if updates:
            db_session.bulk_insert_mappings(AudienceSourcesMatchedPerson, updates)
            logging.info(f"Inserted {len(updates)} new persons for source_id {source_id}")

    return len(updates)

async def process_and_send_chunks(
    db_session: Session,
    source_id: str,
    batch_size: int,
    queue_name: str,
    connection,
    status: str
):
    outgoing: List[Tuple[str, MessageBody]] = []
    with db_session.begin():
        result = (
            db_session.query(
                func.min(AudienceSourcesMatchedPerson.amount).label('min_orders_amount'),
                func.max(AudienceSourcesMatchedPerson.amount).label('max_orders_amount'),
                func.min(AudienceSourcesMatchedPerson.count).label('min_orders_count'),
                func.max(AudienceSourcesMatchedPerson.count).label('max_orders_count'),
                func.min(AudienceSourcesMatchedPerson.recency).label('min_recency'),
                func.max(AudienceSourcesMatchedPerson.recency).label('max_recency'),
                func.min(AudienceSourcesMatchedPerson.start_date).label('min_start_date'),
                func.max(AudienceSourcesMatchedPerson.start_date).label('max_start_date'),
                func.count().label('total_count'),
            )
            .filter(
                AudienceSourcesMatchedPerson.source_id == source_id,
                AudienceSourcesMatchedPerson.amount.isnot(None),
                AudienceSourcesMatchedPerson.count.isnot(None),
                AudienceSourcesMatchedPerson.recency.isnot(None),
                AudienceSourcesMatchedPerson.start_date.isnot(None),
            )
            .first()
        )

        total_count = int(result.total_count or 0)
        logging.info(f"Chunk stats: {result}")

        for offset in range(0, total_count, batch_size):
            batch = (
                db_session.query(AudienceSourcesMatchedPerson)
                .filter_by(source_id=source_id)
                .order_by(AudienceSourcesMatchedPerson.id)
                .with_for_update(skip_locked=True)
                .offset(offset)
                .limit(batch_size)
                .all()
            )
            if not batch:
                break

            rows = [
                PersonEntry(
                    id=str(p.id),
                    email=str(p.email),
                    sum_amount=float(p.amount or 0),
                    count=int(p.count),
                    recency=float(p.recency or 0.0)
                )
                for p in batch
            ]
            msg = MessageBody(
                type="emails",
                data=DataBodyNormalize(
                    persons=rows,
                    source_id=source_id,
                    data_for_normalize=DataForNormalize(
                        matched_size=offset + len(rows),
                        all_size=total_count,
                        min_amount=float(result.min_orders_amount or 0.0),
                        max_amount=float(result.max_orders_amount or 1.0),
                        min_count=int(result.min_orders_count or 0),
                        max_count=int(result.max_orders_count or 1),
                        min_start_date=(result.min_start_date.isoformat()
                                        if result.min_start_date else None),
                        max_start_date=(result.max_start_date.isoformat()
                                        if result.max_start_date else None),
                        min_recency=float(result.min_recency or 0.0),
                        max_recency=float(result.max_recency or 1.0),
                    ),
                ),
                status=status
            )
            outgoing.append((queue_name, msg))

    for queue, msg in outgoing:
        await publish_rabbitmq_message(connection=connection, queue_name=queue, message_body=msg)
        logging.info(f"Sent chunk to {queue}: {msg.data.data_for_normalize.matched_size}/{total_count}")

    logging.info(f"All {len(outgoing)} chunks sent for source_id {source_id}")

async def normalize_persons_customer_conversion(
    persons: List[PersonEntry],
    source_id: str,
    data_for_normalize: DataForNormalize,
    db_session: Session,
    source_schema: str
):

    min_recency = Decimal(
        str(data_for_normalize.min_recency)) if data_for_normalize.min_recency is not None else Decimal("0.0")
    max_recency = Decimal(
        str(data_for_normalize.max_recency)) if data_for_normalize.max_recency is not None else Decimal("1.0")
    min_orders_amount = Decimal(data_for_normalize.min_amount) if data_for_normalize.min_amount is not None else Decimal("0.0")
    max_orders_amount = Decimal(data_for_normalize.max_amount) if data_for_normalize.max_amount is not None else Decimal("1.0")

    updates = []

    min_inv = AudienceSourceMath.inverted_decimal(Decimal(min_recency))
    max_inv = AudienceSourceMath.inverted_decimal(Decimal(max_recency))
    if min_orders_amount > max_orders_amount:
        min_orders_amount, max_orders_amount = max_orders_amount, min_orders_amount

    if min_inv > max_inv:
        min_inv, max_inv = max_inv, min_inv

    w1, w2 = Decimal("0.6"), Decimal("0.4")
    if source_schema.lower() == BusinessType.B2C.value:
        # B2C Algorithm:
        # For B2C, the LeadValueScore is based solely on the recency of failed lead attempts.
        # We use the "start_date" field as LastFailedDate.
        denom_amt = max_orders_amount - min_orders_amount if max_orders_amount != min_orders_amount else Decimal("0")
        for person in persons:
            inv = AudienceSourceMath.inverted_decimal(Decimal(person.recency))
            rec_score = AudienceSourceMath.normalize_decimal(
                value=inv, min_val=min_inv, max_val=max_inv
            )

            amt = Decimal(str(getattr(person, "sum_amount", 0) or 0))
            if denom_amt == 0:
                amt_score = Decimal("0")
            else:
                amt_score = (amt - min_orders_amount) / denom_amt

            lead_value = w1 * rec_score + w2 * amt_score

            updates.append({
                "id": person.id,
                "source_id": source_id,
                "email": person.email,
                "recency_min": min_recency,
                "recency_max": max_recency,
                "inverted_recency": inv,
                "inverted_recency_min": min_inv,
                "inverted_recency_max": max_inv,
                "amount": amt,
                "amount_min": min_orders_amount,
                "amount_max": max_orders_amount,
                "recency_score": rec_score,
                "sum_score": amt_score,
                "value_score": lead_value,
            })

    elif source_schema.lower() == BusinessType.B2B.value:
        # B2B Algorithm:
        # For B2B, the score is a combination of three components:
        # 1. Recency Score based on BUSINESS_EMAIL_LAST_SEEN_DATE.
        # 2. Professional Score calculated from JobLevel, Department, and CompanySize.
        # 3. Completeness Score based on the presence of a valid business email, LinkedIn URL,
        #    and non-null professional attributes.
        matched_ids = [UUID(p.id) for p in persons]
        prof_rows = (
            db_session.query(
                AudienceSourcesMatchedPerson.id.label("mp_id"),
                EnrichmentProfessionalProfile.job_level,
                EnrichmentProfessionalProfile.department,
                EnrichmentProfessionalProfile.company_size,
            )
            .join(EnrichmentUser,
                  AudienceSourcesMatchedPerson.enrichment_user_id == EnrichmentUser.id)
            .join(EnrichmentProfessionalProfile,
                  EnrichmentProfessionalProfile.asid == EnrichmentUser.asid)
            .filter(AudienceSourcesMatchedPerson.id.in_(matched_ids))
            .all()
        )
        profile_map = {
            row.mp_id: row for row in prof_rows
        }

        contact_rows = (
            db_session.query(
                AudienceSourcesMatchedPerson.id.label("mp_id"),
                EnrichmentUserContact.business_email,
                EnrichmentUserContact.business_email_validation_status,
                EnrichmentUserContact.linkedin_url,
            )
            .join(EnrichmentUser,
                  AudienceSourcesMatchedPerson.enrichment_user_id == EnrichmentUser.id)
            .join(EnrichmentUserContact,
                  EnrichmentUserContact.asid == EnrichmentUser.asid)
            .filter(AudienceSourcesMatchedPerson.id.in_(matched_ids))
            .all()
        )
        contact_map = {
            row.mp_id: row for row in contact_rows
        }

        inverted_values = []

        for person in persons:
            inv = AudienceSourceMath.inverted_decimal(Decimal(person.recency))
            inverted_values.append(inv)

        job_level_map = {'Executive': Decimal("1.0"), 'Senior': Decimal("0.8"), 'Manager': Decimal("0.6"), 'Entry': Decimal("0.4")}
        department_map = {'Sales': Decimal("1.0"), 'Marketing': Decimal("0.8"), 'Engineering': Decimal("0.6")}
        company_size_map = {'1000+': Decimal("1.0"), '501-1000': Decimal("0.8"), '101-500': Decimal("0.6"), '51-100': Decimal("0.4")}
        for idx, person in enumerate(persons):
            recency_inv = inverted_values[idx]
            recency_score = AudienceSourceMath.normalize_decimal(value=recency_inv, min_val=min_inv, max_val=max_inv)
            prof = profile_map.get(UUID(person.id))
            job_level = getattr(prof, "job_level", None)
            department = getattr(prof, "department", None)
            company_size = getattr(prof, "company_size", None)

            job_level_weight = job_level_map.get(job_level, Decimal("0.2"))
            department_weight = department_map.get(department, Decimal("0.4"))
            company_size_weight = company_size_map.get(company_size, Decimal("0.2"))

            professional_score = (Decimal("0.5") * job_level_weight +
                                  Decimal("0.3") * department_weight +
                                  Decimal("0.2") * company_size_weight)
            completeness_score = Decimal("0.0")
            contact = contact_map.get(UUID(person.id))
            completeness = Decimal("0.0")
            if contact and contact.business_email and contact.business_email_validation_status == 'Valid':
                completeness += Decimal("0.4")
            if contact and contact.linkedin_url:
                completeness += Decimal("0.3")
            if job_level:
                completeness_score += Decimal("0.2")
            if department:
                completeness_score += Decimal("0.1")
            lead_value_score_b2b = (Decimal("0.4") * recency_score +
                                    Decimal("0.4") * professional_score +
                                    Decimal("0.2") * completeness_score)
            update_data = {
                'id': person.id,
                'source_id': source_id,
                'email': person.email,
                'recency_min': min_recency,
                'recency_max': max_recency,
                'inverted_recency': inverted_values[idx],
                'inverted_recency_min': min_inv,
                'inverted_recency_max': max_inv,
                'recency_score': recency_score,
                'view_score': professional_score,
                'sum_score': completeness_score,
                'value_score': lead_value_score_b2b,
            }
            updates.append(update_data)
    else:
        logging.warning(f"Unknown source_schema: {source_schema}. No lead value score computed.")



    if updates:
        db_session.bulk_update_mappings(AudienceSourcesMatchedPerson, updates)
        logging.info(f"Updated {len(updates)} persons with lead value scores.")
        db_session.flush()

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

    logging.info(
        f"RMQ message sent for matched records {data_for_normalize.matched_size} matched persons "
        f"from {data_for_normalize.all_size} matched records."
    )

def calculate_source_data(db_session: Session, source_uuid: UUID) -> List[Dict]:
        def all_columns_except(model, *skip: str):
            return tuple(
                c for c in model.__table__.c
                if c.name not in skip
            )

        q = (
            db_session.query(
                AudienceSourcesMatchedPerson.value_score.label("customer_value"),
                *all_columns_except(EnrichmentPersonalProfiles, "id", "asid"),
                *all_columns_except(EnrichmentFinancialRecord, "id", "asid"),
                *all_columns_except(EnrichmentLifestyle, "id", "asid"),
                *all_columns_except(EnrichmentVoterRecord, "id", "asid"),
                *all_columns_except(EnrichmentProfessionalProfile, "id", "asid"),
                *all_columns_except(EnrichmentEmploymentHistory, "id", "asid")
            )
            .select_from(AudienceSourcesMatchedPerson)
            .join(
                EnrichmentUser,
                AudienceSourcesMatchedPerson.enrichment_user_id == EnrichmentUser.id
            )
            .outerjoin(
                EnrichmentPersonalProfiles,
                EnrichmentPersonalProfiles.asid == EnrichmentUser.asid
            )
            .outerjoin(
                EnrichmentFinancialRecord,
                EnrichmentFinancialRecord.asid == EnrichmentUser.asid
            )
            .outerjoin(
                EnrichmentLifestyle,
                EnrichmentLifestyle.asid == EnrichmentUser.asid
            )
            .outerjoin(
                EnrichmentVoterRecord,
                EnrichmentVoterRecord.asid == EnrichmentUser.asid
            )
            .outerjoin(
                EnrichmentProfessionalProfile,
                EnrichmentProfessionalProfile.asid == EnrichmentUser.asid
            )
            .outerjoin(
                EnrichmentEmploymentHistory,
                EnrichmentEmploymentHistory.asid == EnrichmentUser.asid
            )
            .filter(AudienceSourcesMatchedPerson.source_id == str(source_uuid))
        )

        rows = q.all()

        def _row2dict(row) -> Dict[str, Any]:
            d = dict(row._mapping)
            updated_dict = {}
            for k, v in d.items():
                if k == "age" and v:
                    updated_dict[k] = int(v.lower) if v.lower is not None else None
                elif k == "zip_code5" and v:
                    updated_dict[k] = str(v)
                elif k == "state_abbr":
                    updated_dict["state"] = v
                elif isinstance(v, Decimal):
                    updated_dict[k] = str(v)
                else:
                    updated_dict[k] = v
            return updated_dict

        result: List[Dict[str, Any]] = [_row2dict(r) for r in rows]
        return result

def to_dict(obj):
    return obj if isinstance(obj, dict) else obj.__dict__

def extract_non_zero_values(*insights):
    combined = {}

    for insight in insights:
        for category, fields in to_dict(insight).items():
            if isinstance(fields, dict):
                for key, value in fields.items():
                    rounded = round(value, 2)
                    if rounded != 0:
                        combined[key] = rounded
            else:
                if fields != 0:
                    rounded = round(fields, 2)
                    if rounded != 0:
                        combined[category] = rounded

    return combined

def calculate_and_save_significant_fields(db_session, source_id, similar_audience_service, audience_lookalikes_service):
    audience_source_data = calculate_source_data(db_session=db_session, source_uuid=source_id)
    b2c_insights, b2b_insights, other = audience_lookalikes_service.calculate_insights(audience_data=audience_source_data, similar_audience_service=similar_audience_service)
    combined_insights = extract_non_zero_values(b2c_insights, b2b_insights, other)
    db_session.execute(
            update(AudienceSource)
            .where(AudienceSource.id == source_id)
            .values(
                significant_fields=combined_insights
            )
        )

async def aud_sources_matching(message: IncomingMessage, db_session: Session, connection: Connection, similar_audience_service: SimilarAudienceService, audience_lookalikes_service: AudienceLookalikesService):
    try:
        message_body_dict = json.loads(message.body)
        message_body = MessageBody(**message_body_dict)
        data: Union[DataBodyNormalize, DataBodyFromSource] = message_body.data
        source_id: str = data.source_id
        with db_session.begin():
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
        with db_session.begin():
            if type == 'emails' and data_for_normalize:
                if data_for_normalize.matched_size == data_for_normalize.all_size:
                    calculate_and_save_significant_fields(db_session, source_id, similar_audience_service, audience_lookalikes_service)

                if message_body.status == TypeOfCustomer.CUSTOMER_CONVERSIONS.value:
                    await normalize_persons_customer_conversion(persons=persons, source_id=source_id, data_for_normalize=data_for_normalize,
                                                                db_session=db_session, source_schema=audience_source.target_schema)

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
        db_session.commit()
        logging.info(f"Updated processed and matched records for source_id {source_id}.")

        if processed_records >= total_records:
            InsightsUtils.process_insights(source_id=source_id, db_session=db_session)
            if type == 'user_ids':
                calculate_and_save_significant_fields(db_session, source_id, similar_audience_service,
                                                      audience_lookalikes_service)


            logging.info(f"Source_id {source_id} processing complete.")


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
        similar_audience_service = SimilarAudienceService(audience_data_normalization_service=AudienceDataNormalizationService())
        audience_lookalikes_service = AudienceLookalikesService(lookalikes_persistence_service=None)
        await queue.consume(
            functools.partial(aud_sources_matching, connection=connection, db_session=db_session, similar_audience_service=similar_audience_service, audience_lookalikes_service=audience_lookalikes_service)
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
