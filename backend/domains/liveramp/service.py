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

# from .file_builder import build_rows_from_dataframe, write_tsv
# from .persistence.liveramp_uploader import upload_file
from .exceptions import LiverampError
import logging

logger = logging.getLogger(__name__)


@injectable
class LiverampService:
    def __init__(
        self,
        postgres_persistence: PostgresPersistence,
        clickhouse_persistence: ClickHousePersistence,
        # s3_repo: DelivrPersistence,
        # sf_repo: SnowflakePersistence,
    ):
        self.postgres = postgres_persistence
        self.clickhouse = clickhouse_persistence
        # self.s3 = s3_repo
        # self.sf = sf_repo

    def process_leads_last_week(
        self,
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Any]]:
        try:
            logger.info(
                "Step 1: Fetching leads from PostgreSQL for the last week..."
            )
            leads_data = self.postgres.fetch_leads_last_week()

            if not leads_data:
                logger.info("No leads found for the last week")
                return [], [], {}

            stats = self.postgres.get_lead_statistics(leads_data)
            logger.info(f"PostgreSQL statistics: {stats}")

            emails = self.postgres.extract_emails_from_leads(leads_data)
            logger.info(
                f"Step 2: Extracted {len(emails)} unique emails for enrichment"
            )

            if not emails:
                logger.warning("No emails found in leads data")
                return leads_data, [], stats

            logger.info("Step 3: Enriching data from ClickHouse...")
            enriched_data = self.clickhouse.match_leads_with_users(emails)

            stats["enriched_users"] = len(enriched_data)
            stats["enrichment_rate"] = (
                f"{(len(enriched_data) / len(emails)) * 100:.1f}%"
                if emails
                else "0%"
            )

            logger.info(
                f"Step 4: Successfully enriched {len(enriched_data)} users out of {len(emails)} emails"
            )

            return leads_data, enriched_data, stats

        except Exception as e:
            logger.error(f"Error in process_leads_last_week: {e}")
            raise

    async def process_leads_by_days(
        self, days: int
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Any]]:
        try:
            logger.info(f"Processing leads for last {days} days...")

            leads_data = self.postgres.fetch_leads_by_days(days)

            if not leads_data:
                return [], [], {}

            emails = self.postgres.extract_emails_from_leads(leads_data)

            if not emails:
                return (
                    leads_data,
                    [],
                    self.postgres.get_lead_statistics(leads_data),
                )

            enriched_data = self.clickhouse.match_leads_with_users(emails)

            stats = self.postgres.get_lead_statistics(leads_data)
            stats["enriched_users"] = len(enriched_data)

            return leads_data, enriched_data, stats

        except Exception as e:
            logger.error(f"Error processing leads for {days} days: {e}")
            raise

    def format_enriched_data_to_csv(
        self, enriched_data: List[Dict[str, Any]]
    ) -> str:
        if not enriched_data:
            return ""

        # Определяем порядок колонок как в требовании
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

        for row in enriched_data:
            writer.writerow(row)

        csv_content = output.getvalue()
        logger.info(
            f"Formatted CSV with {len(enriched_data)} rows, {len(csv_content)} characters"
        )

        return csv_content

    def generate_enriched_leads_report(self) -> Tuple[str, Dict[str, Any]]:
        leads_data, enriched_data, statistics = self.process_leads_last_week()
        csv_content = self.format_enriched_data_to_csv(enriched_data)
        return csv_content, statistics

    def save_csv_to_file(
        self, csv_content: str, filename: str = "enriched_leads.csv"
    ):
        if not csv_content:
            logger.warning("No CSV content to save")
            return

        with open(filename, "w", newline="", encoding="utf-8") as f:
            f.write(csv_content)
        logger.info(f"CSV report saved to {filename}")

    # def run_export_and_upload(
    #     self,
    #     start_dt: datetime | None = None,
    #     end_dt: datetime | None = None,
    #     audience: str | None = None,
    # ):
    #     # default last 7 days
    #     end_dt = end_dt or datetime.utcnow()
    #     start_dt = start_dt or (end_dt - timedelta(days=7))
    #     audience = audience or config.AUDIENCE_NAME
    #
    #     # 1) fetch leads from Postgres
    #     leads_df = self.pg.fetch_leads(start_dt, end_dt)
    #     print(f"Leads fetched: {len(leads_df)} rows")
    #
    #     # 2) fetch enrichment from ClickHouse (for that week)
    #     enrichment_df = self.ch.fetch_enrichment(start_dt, end_dt)
    #     print(f"Enrichment fetched: {len(enrichment_df)} rows")
    #
    #     # 3) merge leads and enrichment — priority join by asid
    #     # normalize columns
    #     leads_df = leads_df.rename(
    #         columns={c: c.lower() for c in leads_df.columns}
    #     )
    #     enrichment_df = enrichment_df.rename(
    #         columns={c: c.lower() for c in enrichment_df.columns}
    #     )
    #
    #     merged = leads_df.merge(enrichment_df, how="left", on="asid")
    #     print(f"Merged by ASID: {len(merged)} rows")
    #
    #     # 4) fetch delivr parquet(s) for the dates in the range (iterate days)
    #     s3_dfs = []
    #     cur = start_dt
    #     while cur.date() <= end_dt.date():
    #         date_str = cur.strftime("%Y%m%d")
    #         keys = self.s3.list_objects_for_date(date_str)
    #         for key in keys:
    #             try:
    #                 df = self.s3.read_parquet_to_df(key)
    #                 df = df.rename(columns={c: c.lower() for c in df.columns})
    #                 s3_dfs.append(df)
    #             except Exception as e:
    #                 print(f"Warning: failed to read {key}: {e}")
    #         cur += timedelta(days=1)
    #     if s3_dfs:
    #         s3_all = pd.concat(s3_dfs, ignore_index=True)
    #         # merge on asid if available, else on email
    #         if "asid" in s3_all.columns:
    #             merged = merged.merge(s3_all, how="left", on="asid")
    #         else:
    #             merged = merged.merge(
    #                 s3_all,
    #                 how="left",
    #                 left_on="business_email",
    #                 right_on="business_emails",
    #             )
    #         print(f"After merging S3: {len(merged)} rows")
    #     else:
    #         print("No delivr parquet files found for date range")
    #
    #     # 5) fetch snowflake data — example query, adjust as required
    #     sf_sql = "SELECT * FROM SPORTS_INNOVATION_LAB__ALLFORCE_PRIVATE_SHARE.SC_ALLFORCE.SIL_ALLFORCE_MERCHANT_SHARE_20251013_SV WHERE segment='BEAUTY_ENTHUSIASTS'"
    #     try:
    #         sf_df = self.sf.query_to_df(sf_sql)
    #         sf_df = sf_df.rename(columns={c: c.lower() for c in sf_df.columns})
    #         if "asid" in sf_df.columns:
    #             merged = merged.merge(sf_df, how="left", on="asid")
    #         print(f"After merging Snowflake: {len(merged)} rows")
    #     except Exception as e:
    #         print(f"Snowflake fetch warning: {e}")
    #
    #     # 6) prepare final DataFrame for file builder
    #     # ensure an ASID exists — otherwise skip
    #     merged = merged[merged["asid"].notna()]
    #
    #     # normalize phone
    #     merged["phone"] = (
    #         merged.get("phone").apply(
    #             lambda x: utils.normalize_phone(x) if pd.notna(x) else None
    #         )
    #         if "phone" in merged.columns
    #         else None
    #     )
    #
    #     # 7) build rows and write TSV
    #     ts = datetime.utcnow()
    #     fname = utils.filename_for_audience(audience, ts)
    #     out_path = os.path.join(config.OUTPUT_DIR, fname)
    #     rows_iter = build_rows_from_dataframe(merged)
    #     write_tsv(out_path, rows_iter)
    #     print(f"File written: {out_path}")
    #
    #     # 8) upload to LiveRamp
    #     remote_subdir = audience
    #     remote_path = upload_file(out_path, remote_subdir=remote_subdir)
    #     print(f"Uploaded to: {remote_path}")
    #
    #     return out_path, remote_path
