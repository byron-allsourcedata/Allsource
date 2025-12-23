import asyncio
from collections import defaultdict
import os
import sys
import time
import json
from uuid import NAMESPACE_URL, uuid5
import uuid
from numpy import empty
import pandas as pd
from sqlalchemy import create_engine, true
import sqlalchemy
from sqlalchemy.orm import load_only
import logging
from datetime import datetime, timedelta


current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)
from services.etl.leads.sessionizer import floor_to_slot, map_behavior_type
from domains.leads.entities import Visit
from persistence.delivr.client import AsyncDelivrClickHouseClient
from persistence.delivr.leads_users_repo import LeadsUsersRepository
from persistence.delivr.leads_visits_repo import LeadsVisitsRepository
from persistence.delivr.raw_events_repo import RawEventsRepository
from services.etl.leads.aggregations import aggregate_users
from services.etl.leads.windows import resolve_window
from db_dependencies import Clickhouse, Db
from models import (
    FiveXFiveUser,
    LeadUser,
    LeadsRequests,
    LeadsVisits,
    UserDomains,
    UserSubscriptions,
    Users,
)
from resolver import Resolver

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LeadsToClickHouseMigrator:
    def __init__(self, db_session):
        self.db_session = db_session

    def _collect_emails_from_user(self, user: FiveXFiveUser) -> list[str]:
        emails: set[str] = set()
        for raw in [
            user.business_email,
            user.personal_emails,
            user.additional_personal_emails,
        ]:
            if not raw:
                continue
            if isinstance(raw, str):
                try:
                    parsed = json.loads(raw)
                    if isinstance(parsed, list):
                        for item in parsed:
                            if isinstance(item, str) and item.strip():
                                emails.add(item.strip().lower())
                        continue
                    elif isinstance(parsed, str) and parsed.strip():
                        emails.add(parsed.strip().lower())
                        continue
                except json.JSONDecodeError:
                    pass
                emails.add(raw.strip().lower())
            elif isinstance(raw, list):
                for item in raw:
                    if isinstance(item, str) and item.strip():
                        emails.add(item.strip().lower())
        return list(emails)

    async def find_delivr_by_emails(
        self,
        five_x_five_users: list[FiveXFiveUser],
        table_name: str,
        ch_session,
    ):
        emails = []
        email_owner: dict[str, FiveXFiveUser] = {}
        for user in five_x_five_users:
            for e in self._collect_emails_from_user(user):
                if e not in email_owner:
                    email_owner[e] = user
                emails.append(e)

        if not emails:
            logger.info("Нет email для поиска в ClickHouse")
            return []
        emails = list(set(emails))

        existing = await ch_session.query(
            f"""
            SELECT *
            FROM {table_name}
            WHERE
                arrayExists(x -> lowerUTF8(toString(x)) IN %(emails)s, ifNull(emails, []))
                OR arrayExists(x -> lowerUTF8(toString(x)) IN %(emails)s, ifNull(primary_contact_emails, []))
                OR arrayExists(x -> lowerUTF8(toString(x)) IN %(emails)s, ifNull(valid_emails, []))
                OR arrayExists(x -> lowerUTF8(toString(x)) IN %(emails)s, ifNull(personal_emails, []))
                OR arrayExists(x -> lowerUTF8(toString(x)) IN %(emails)s, ifNull(business_emails, []))
            """,
            {"emails": [e.lower() for e in emails]},
        )

        email_to_profile: dict[str, dict[str, str]] = {}

        def _row_has_email(row, email_lc: str) -> bool:
            for key in [
                "emails",
                "primary_contact_emails",
                "valid_emails",
                "personal_emails",
                "business_emails",
            ]:
                val = row.get(key)
                if isinstance(val, list):
                    if any(
                        isinstance(x, str) and x.lower() == email_lc
                        for x in val
                    ):
                        return True
                elif isinstance(val, str) and val.lower() == email_lc:
                    return True
            return False

        for row in existing:
            profile = row.get("profile_pid_all")
            company_id = row.get("company_id")
            for e in emails:
                el = e.lower()
                if el in email_to_profile:
                    continue
                if _row_has_email(row, el):
                    email_to_profile[el] = {
                        "profile_pid_all": profile,
                        "company_id": company_id,
                    }

        result = []
        for e in emails:
            owner = email_owner.get(e)
            profile_pid_info = email_to_profile.get(e.lower())
            if profile_pid_info is not None:
                result.append(
                    {
                        "five_x_five_user_id": owner.id if owner else None,
                        "profile_pid_all": profile_pid_info["profile_pid_all"],
                        "company_id": profile_pid_info["company_id"],
                    }
                )
        unique_result = [dict(t) for t in {tuple(d.items()) for d in result}]
        return unique_result

    def build_visits(
        self, pixel_id, lead_user, profile_pid_all, company_id
    ) -> list[Visit]:
        profile = profile_pid_all
        visits: list[Visit] = []

        leads_requests = (
            self.db_session.query(LeadsRequests)
            .where(LeadsRequests.lead_id == lead_user.id)
            .order_by(LeadsRequests.requested_at)
            .all()
        )

        if not leads_requests:
            return visits

        requests_by_interval = defaultdict(list)

        for request in leads_requests:
            request_time = request.requested_at
            interval_start = self._round_to_30_minutes(request_time)
            requests_by_interval[interval_start].append(request)

        for interval_start, interval_requests in sorted(
            requests_by_interval.items()
        ):
            interval_requests.sort(key=lambda x: x.requested_at)

            visit_start = interval_requests[0].requested_at
            visit_end = interval_requests[-1].requested_at
            interval_end = interval_start + timedelta(minutes=30)

            if visit_end > interval_end:
                visit_end = interval_end

            evs = []
            for request in interval_requests:
                evs.append(
                    (
                        request.requested_at,
                        {
                            "visit_id": request.visit_id,
                            "page_url": request.page,
                            "page_parameters": request.page_parameters,
                        },
                    )
                )

            evs.sort(key=lambda x: x[0])

            full_time = max(int((visit_end - visit_start).total_seconds()), 1)
            unique_page_urls = set(ev[1]["page_url"] for ev in evs)
            pages_count = len(unique_page_urls)
            average_time = (
                max(full_time // pages_count, 1) if pages_count > 0 else 1
            )

            visit_id = uuid5(
                NAMESPACE_URL,
                f"{pixel_id}:{profile}:{visit_start.isoformat()}:{interval_start.isoformat()}",
            )
            leads_visit = (
                self.db_session.query(LeadsVisits)
                .where(LeadsVisits.id == evs[0][1]["visit_id"])
                .first()
            )
            event_type = leads_visit.behavior_type
            ip = leads_visit.ip

            for i, (ts, e) in enumerate(evs):
                if i + 1 < len(evs):
                    delta = int((evs[i + 1][0] - ts).total_seconds())
                    spent = max(delta, 1)
                else:
                    spent = 1

                page = e.get("page_url", "")
                params = json.dumps(
                    e.get("page_parameters", {}), ensure_ascii=False
                )

                visits.append(
                    Visit(
                        profile_pid_all=profile,
                        pixel_id=pixel_id,
                        visit_id=visit_id,
                        page=page,
                        page_parameters=params,
                        requested_at=ts,
                        spent_time_sec=spent,
                        visit_start=visit_start,
                        visit_end=visit_end,
                        behavior_type=map_behavior_type(event_type),
                        ip=ip,
                        pages_count=pages_count,
                        average_time_sec=average_time,
                        full_time_sec=full_time,
                        company_id=company_id,
                    )
                )

        return visits

    async def preparate_and_insert_leads(self, lead_users, pixel_id):
        five_x_five_user_ids = [
            lead_user.five_x_five_user_id for lead_user in lead_users
        ]
        five_x_five_users = (
            self.db_session.query(FiveXFiveUser)
            .filter(FiveXFiveUser.id.in_(five_x_five_user_ids))
            .all()
        )
        logger.info(f"five_x_five_users len {len(five_x_five_users)}")
        etl_logger = logging.getLogger("delivr_sync")
        ch_session = await AsyncDelivrClickHouseClient().connect()
        try:
            users_repo = LeadsUsersRepository(ch_session)
            visits_repo = LeadsVisitsRepository(ch_session)
            etl_logger.info("Fetching raw events for pixel_id=%s", pixel_id)
            delivr_users = await self.find_delivr_by_emails(
                five_x_five_users, "allsource_prod.delivr_users", ch_session
            )
            if delivr_users is empty:
                return

            await self.insert_leads_visits(
                pixel_id,
                delivr_users,
                lead_users,
                visits_repo,
                users_repo,
            )

        except Exception:
            etl_logger.exception("ETL run failed for pixel_id=%s", pixel_id)
            raise
        finally:
            await ch_session.close()

    def _round_to_30_minutes(self, dt: datetime) -> datetime:
        minutes = dt.minute
        if minutes < 30:
            rounded_minutes = 0
        else:
            rounded_minutes = 30

        return dt.replace(minute=rounded_minutes, second=0, microsecond=0)

    def chunked(self, iterable, size):
        for i in range(0, len(iterable), size):
            yield iterable[i : i + size]

    async def insert_leads_visits(
        self, pixel_id, delivr_users, lead_users, visits_repo, users_repo
    ):
        for delivr_user in delivr_users:
            lead_user = next(
                (
                    user
                    for user in lead_users
                    if user.five_x_five_user_id
                    == delivr_user["five_x_five_user_id"]
                ),
                None,
            )
            visits = self.build_visits(
                pixel_id,
                lead_user,
                delivr_user["profile_pid_all"],
                delivr_user["company_id"],
            )
            if visits:
                users = aggregate_users(visits)
                logger.info("Aggregated %d users", len(users))
                await users_repo.insert_async(users)
                await visits_repo.insert_async(visits)
                logger.info("Inserted %d visits into ClickHouse", len(visits))

    async def run_migration(self):
        logger.info("Запуск миграции лидов в ClickHouse")
        start_time = datetime.now()
        users = (
            self.db_session.query(Users)
            .where(Users.email == "master-demo@maximiz.ai")
            .all()
        )
        for user in users:
            logger.info(f"name {user.email}")
            user_domains = (
                self.db_session.query(UserDomains)
                .options(
                    load_only(
                        UserDomains.id,
                        UserDomains.user_id,
                        UserDomains.domain,
                        UserDomains.data_provider_id,
                        UserDomains.pixel_id,
                    )
                )
                .where(UserDomains.user_id == user.id)
                .all()
            )
            for user_domain in user_domains:
                lead_users = (
                    self.db_session.query(LeadUser)
                    .where(LeadUser.domain_id == user_domain.id)
                    .order_by(LeadUser.created_at)
                    .all()
                )
                pixel_id = user_domain.pixel_id
                if not pixel_id:
                    pixel_id = uuid5(NAMESPACE_URL, str(user_domain.id))
                    user_domain.pixel_id = pixel_id
                    self.db_session.commit()
                logger.info(f"lead_users len {len(lead_users)}")
                if lead_users:
                    batch_size = 500
                    for batch in self.chunked(lead_users, batch_size):
                        await self.preparate_and_insert_leads(batch, pixel_id)
                        print("NEXT--------NEXT")

        end_time = datetime.now()
        duration = end_time - start_time

        logger.info("=" * 50)
        logger.info("МИГРАЦИЯ ЗАВЕРШЕНА")
        logger.info(f"Общее время выполнения: {duration}")
        logger.info("=" * 50)


async def main():
    resolver = Resolver()
    try:
        db_session = await resolver.resolve(Db)
        await LeadsToClickHouseMigrator(db_session=db_session).run_migration()
    except Exception as err:
        logging.error(f"Unhandled Exception: {err}", exc_info=True)
    finally:
        logging.info("Shutting down...")
        await resolver.cleanup()
        time.sleep(10)


if __name__ == "__main__":
    asyncio.run(main())
