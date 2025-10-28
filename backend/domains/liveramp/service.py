import csv
import io
from resolver import injectable
from .file_service import LiveRampFileService
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
        file_service: LiveRampFileService,
    ):
        self.postgres = postgres_persistence
        self.clickhouse = clickhouse_persistence
        self.delivr = delivr_persistence
        self.snowflake = snowflake_persistence
        self.file_service = file_service

    async def generate_combined_report(self) -> Tuple[str, str, Dict[str, Any]]:
        """
        1. PostgreSQL + ClickHouse
        2. Delivr S3 + ClickHouse
        3. Snowflake + ClickHouse
        """
        try:
            statistics = {}

            logger.info("Step 1: Fetching data from PostgreSQL + ClickHouse...")
            postgres_clickhouse_data = (
                await self._get_postgres_clickhouse_data()
            )
            statistics["postgres_clickhouse_records"] = len(
                postgres_clickhouse_data
            )

            logger.info("Step 2: Fetching unified data from Delivr S3...")
            delivr_data = await self.delivr.fetch_weekly_unified_data(days=7)
            statistics["delivr_records"] = len(delivr_data)

            logger.info("Step 3: Fetching data from Snowflake...")
            snowflake_data = await self._get_snowflake_data()
            statistics["snowflake_records"] = len(snowflake_data)

            logger.info("Step 4: Combining all data sources...")
            combined_data = (
                postgres_clickhouse_data + delivr_data + snowflake_data
            )
            statistics["combined_records"] = len(combined_data)

            logger.info("Step 4.5: Checking for duplicates...")
            duplicate_check = self._check_for_duplicates(combined_data)
            statistics.update(duplicate_check)

            logger.info("Step 5: Formatting to CSV...")
            csv_content = self.file_service.format_data_to_csv(combined_data)

            logger.info("Step 6: Saving to file...")
            filepath = self.file_service.save_csv_to_file(csv_content)

            logger.info(
                f"Final combined report: {len(combined_data)} total records"
            )
            logger.info(f"File saved: {filepath}")

            return csv_content, filepath, statistics

        except Exception as e:
            logger.error(f"Error generating combined report: {e}")
            raise

    def _check_for_duplicates(
        self, data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        asid_count = {}
        duplicate_info = {
            "total_unique_asids": 0,
            "total_duplicate_asids": 0,
            "duplicate_examples": [],
        }

        for record in data:
            asid = record.get("ASID")
            if asid:
                asid_count[asid] = asid_count.get(asid, 0) + 1

        unique_asids = set()
        duplicate_asids = set()

        for asid, count in asid_count.items():
            if count == 1:
                unique_asids.add(asid)
            else:
                duplicate_asids.add(asid)

        duplicate_info["total_unique_asids"] = len(unique_asids)
        duplicate_info["total_duplicate_asids"] = len(duplicate_asids)

        if duplicate_asids:
            examples = list(duplicate_asids)[:5]
            duplicate_info["duplicate_examples"] = examples
            logger.warning(
                f"Found {len(duplicate_asids)} duplicate ASIDs. Examples: {examples}"
            )
        else:
            logger.info("No duplicate ASIDs found in source data")

        return duplicate_info

    async def _get_postgres_clickhouse_data(self) -> List[Dict[str, Any]]:
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
        try:
            return await self.snowflake.get_snowflake_data()
        except Exception as e:
            logger.error(f"Error getting Snowflake data: {e}")
            return []
