import asyncio
import logging
import os
import sys

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

from db_dependencies import Db
from resolver import Resolver
from persistence.plans_persistence import PlansPersistence
from persistence.user_subscriptions import UserSubscriptionsPersistence
from services.user_subscriptions import (
    UserSubscriptionsService,
)  # путь к твоему классу

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    data_map = [
        {
            "type": "business_email",
            "value": "Business Email",
            "is_constant": None,
        },
        {
            "type": "current_company_name",
            "value": "Current Company Name",
            "is_constant": None,
        },
        {
            "type": "current_job_title",
            "value": "Job Title",
            "is_constant": None,
        },
        {"type": "department", "value": "Department", "is_constant": None},
        {"type": "primary_industry", "value": "Industry", "is_constant": None},
        {"type": "company_size", "value": "Company Size", "is_constant": None},
        {
            "type": "business_country",
            "value": "Business Country",
            "is_constant": None,
        },
        {
            "type": "business_state",
            "value": "Business State",
            "is_constant": None,
        },
        {
            "type": "business_city",
            "value": "Business City",
            "is_constant": None,
        },
        {
            "type": "business_postal_code",
            "value": "Business Postal Code",
            "is_constant": None,
        },
        {
            "type": "personal_email",
            "value": "Personal Email",
            "is_constant": None,
        },
        {"type": "gender", "value": "Gender", "is_constant": None},
        {"type": "age", "value": "Age", "is_constant": None},
        {"type": "home_state", "value": "Home State", "is_constant": None},
        {"type": "home_city", "value": "Home City", "is_constant": None},
        {"type": "homeowner", "value": "Homeowner", "is_constant": None},
        {"type": "income_range", "value": "Income Range", "is_constant": None},
        {"type": "has_children", "value": "Has Children", "is_constant": None},
    ]

    required_types = {m.get("type") for m in (data_map or []) if m.get("type")}

    print(required_types, len(required_types))


if __name__ == "__main__":
    asyncio.run(main())
