import csv
import io
import os
from datetime import datetime, timedelta
import pandas as pd
from resolver import injectable
from .persistence.clickhouse import ClickHousePersistence
from .persistence.postgresql import PostgresPersistence
from .persistence.delivr_s3 import DelivrPersistence
from .persistence.snowflake import SnowflakePersistence
from typing import List, Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)


@injectable
class LiverampService:
    def __init__(
        self,
        postgres_persistence: PostgresPersistence,
        clickhouse_persistence: ClickHousePersistence,
        delivr_persistence: DelivrPersistence,
        snowflake_persistence: SnowflakePersistence,
    ):
        self.postgres = postgres_persistence
        self.clickhouse = clickhouse_persistence
        self.delivr = delivr_persistence
        self.snowflake = snowflake_persistence

    async def generate_combined_report(self) -> Tuple[str, Dict[str, Any]]:
        """
        1. PostgreSQL + ClickHouse
        2. Delivr S3 + ClickHouse
        3. Snowflake + ClickHouse
        """
        try:
            statistics = {}

            # 1. Получаем данные из PostgreSQL + ClickHouse (уже в правильном формате)
            logger.info("Step 1: Fetching data from PostgreSQL + ClickHouse...")
            postgres_clickhouse_data = (
                await self._get_postgres_clickhouse_data()
            )
            statistics["postgres_clickhouse_records"] = len(
                postgres_clickhouse_data
            )

            # 2. Получаем данные из Delivr S3 (уже преобразованные в единый формат)
            logger.info("Step 2: Fetching unified data from Delivr S3...")
            delivr_data = await self.delivr.fetch_weekly_unified_data(days=7)
            statistics["delivr_records"] = len(delivr_data)

            # 3. Получаем данные из Snowflake
            logger.info("Step 3: Fetching data from Snowflake...")
            snowflake_data = await self._get_snowflake_data()
            statistics["snowflake_records"] = len(snowflake_data)

            # 4. Объединяем все данные
            logger.info("Step 4: Combining all data sources...")
            combined_data = (
                postgres_clickhouse_data + delivr_data + snowflake_data
            )
            statistics["combined_records"] = len(combined_data)

            # 5. Форматируем в CSV
            logger.info("Step 5: Formatting to CSV...")
            csv_content = self._format_unified_data_to_csv(combined_data)

            logger.info(
                f"Final combined report: {len(combined_data)} total records"
            )
            return csv_content, statistics

        except Exception as e:
            logger.error(f"Error generating combined report: {e}")
            raise

    async def _get_postgres_clickhouse_data(self) -> List[Dict[str, Any]]:
        """Получаем данные из PostgreSQL и обогащаем через ClickHouse"""
        try:
            leads_data = self.postgres.fetch_leads_last_week()
            if not leads_data:
                return []

            emails = self.postgres.extract_emails_from_leads(leads_data)
            if not emails:
                return []

            return self.clickhouse.match_leads_with_users(emails)

        except Exception as e:
            logger.error(f"Error getting PostgreSQL+ClickHouse data: {e}")
            return []

    async def _get_snowflake_data(self) -> List[Dict[str, Any]]:
        """Получаем данные из Snowflake"""
        try:
            # TODO: Добавить преобразование Snowflake данных в единый формат
            return await self.snowflake.fetch_weekly_data(days=7)
        except Exception as e:
            logger.error(f"Error getting Snowflake data: {e}")
            return []

    def _format_unified_data_to_csv(
        self, unified_data: List[Dict[str, Any]]
    ) -> str:
        """Форматируем унифицированные данные в CSV"""
        if not unified_data:
            return ""

        fieldnames = [
            "ASID",
            "FirstName",
            "LastName",
            "BUSINESS_EMAIL",
            "PERSONAL_EMAIL",
            "PhoneMobile1",
            "HomeCity",
            "HomeState",
            "Gender",
            "Age",
            "MaritalStatus",
            "Pets",
            "ChildrenPresent",
            "Spend",
        ]

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fieldnames, delimiter="\t")
        writer.writeheader()

        for record in unified_data:
            row = {field: record.get(field, "") for field in fieldnames}
            writer.writerow(row)

        csv_content = output.getvalue()
        logger.info(f"Formatted CSV with {len(unified_data)} rows")
        return csv_content

    def save_csv_to_file(
        self, csv_content: str, filename: str = "combined_report.csv"
    ):
        """Сохраняем CSV в файл"""
        if not csv_content:
            logger.warning("No CSV content to save")
            return

        with open(filename, "w", newline="", encoding="utf-8") as f:
            f.write(csv_content)
        logger.info(f"CSV report saved to {filename}")
