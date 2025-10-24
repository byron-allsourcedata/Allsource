from requests import session

from config.database import SessionLocal
from db_dependencies import Db
from resolver import injectable
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
import logging

from models.five_x_five_users import FiveXFiveUser
from models.five_x_five_emails import FiveXFiveEmails
from models.five_x_five_users_emails import FiveXFiveUsersEmails
from models.leads_users import LeadUser
from models.leads_visits import LeadsVisits

from sqlalchemy.orm import aliased
from sqlalchemy import func, and_


@injectable
class PostgresPersistence:
    def __init__(self, db: Db):
        self.db = db

    def fetch_leads_last_week(self) -> List[Dict[str, Any]]:
        """Получаем leads за последнюю неделю с их email адресами"""
        one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        return self._fetch_leads_by_date_range(
            one_week_ago, datetime.now(timezone.utc)
        )

    def fetch_leads_by_days(self, days: int) -> List[Dict[str, Any]]:
        """Получаем leads за указанное количество дней"""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        return self._fetch_leads_by_date_range(
            start_date, datetime.now(timezone.utc)
        )

    def _fetch_leads_by_date_range(
        self, start_date: datetime, end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Внутренний метод для получения leads по диапазону дат"""
        try:
            # Subquery для последних визитов каждого lead
            LV = aliased(LeadsVisits)
            last_visit_subquery = (
                self.db.query(
                    LV.lead_id, func.max(LV.id).label("last_visit_id")
                )
                .group_by(LV.lead_id)
                .subquery()
            )

            # Основной запрос для получения leads с email и информацией о визитах
            query = (
                self.db.query(
                    LeadUser.id.label("lead_id"),
                    LeadUser.created_at.label("lead_created_at"),
                    FiveXFiveUser.id.label("user_id"),
                    FiveXFiveEmails.email.label("email"),
                    FiveXFiveUsersEmails.type.label("email_type"),
                    LeadsVisits.start_date.label("start_date"),
                    LeadsVisits.start_time.label("start_time"),
                    last_visit_subquery.c.last_visit_id,
                )
                .join(
                    FiveXFiveUser,
                    FiveXFiveUser.id == LeadUser.five_x_five_user_id,
                )
                .join(
                    FiveXFiveUsersEmails,
                    FiveXFiveUsersEmails.user_id == FiveXFiveUser.id,
                )
                .join(
                    FiveXFiveEmails,
                    FiveXFiveEmails.id == FiveXFiveUsersEmails.email_id,
                )
                .outerjoin(
                    LeadsVisits, LeadsVisits.id == LeadUser.first_visit_id
                )
                .outerjoin(
                    last_visit_subquery,
                    last_visit_subquery.c.lead_id == LeadUser.id,
                )
                .filter(
                    and_(
                        LeadUser.created_at >= start_date,
                        LeadUser.created_at <= end_date,
                    )
                )
                .order_by(LeadUser.created_at.desc())
            )

            results = query.all()

            leads_dict = {}
            for row in results:
                lead_id = row.lead_id

                if lead_id not in leads_dict:
                    leads_dict[lead_id] = {
                        "lead_id": lead_id,
                        "lead_created_at": row.lead_created_at,
                        "user_id": row.user_id,
                        "emails": [],
                        "first_visit": {
                            "date": row.start_date,
                            "time": row.start_time,
                        },
                        "last_visit_id": row.last_visit_id,
                    }

                if row.email and row.email.strip():
                    test_emails = self._get_test_emails()
                    for test_email in test_emails:
                        leads_dict[lead_id]["emails"].append(
                            {
                                "email": test_email.strip().lower(),
                            }
                        )

                    # Также добавляем оригинальный email
                    leads_dict[lead_id]["emails"].append(
                        {
                            "email": row.email.strip().lower(),
                        }
                    )

            leads_data = list(leads_dict.values())
            logging.info(
                f"Retrieved {len(leads_data)} leads from PostgreSQL with {sum(len(lead['emails']) for lead in leads_data)} total emails"
            )
            return leads_data

        except Exception as e:
            logging.error(f"Error fetching leads from PostgreSQL: {e}")
            raise

    def extract_emails_from_leads(
        self, leads_data: List[Dict[str, Any]]
    ) -> List[str]:
        """Извлекаем все уникальные email адреса из данных leads"""
        emails = set()
        for lead in leads_data:
            for email_data in lead.get("emails", []):
                email = email_data["email"]
                if email and email.strip():
                    emails.add(email.strip().lower())
        return list(emails)

    def get_lead_statistics(
        self, leads_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Получаем статистику по leads"""
        total_leads = len(leads_data)
        total_emails = sum(len(lead.get("emails", [])) for lead in leads_data)
        leads_with_emails = sum(1 for lead in leads_data if lead.get("emails"))
        unique_emails = len(self.extract_emails_from_leads(leads_data))

        return {
            "total_leads": total_leads,
            "leads_with_emails": leads_with_emails,
            "total_emails": total_emails,
            "unique_emails": unique_emails,
        }

    def _get_test_emails(self) -> List[str]:
        # Замените на реальные email из вашей базы ClickHouse
        return [
            "andy@kanakuk.com",
            "toddmoilesillip@rocketmail.com",
            "frthbrds@yahoo.com",
            "amanda.woodye7@hotmail.com",
            "outsidersc@hotmail.combaldbob@glsc.com",
            "bcercone@comcast.net",
            "fjames6420@netscape.com",
            "colleenahill@hotmail.com",
            "staceyamy@bellsouth.net",
            "raynebow1125@aol.com",
            # Добавьте реальные email из вашей таблицы enrichment_users
        ]
