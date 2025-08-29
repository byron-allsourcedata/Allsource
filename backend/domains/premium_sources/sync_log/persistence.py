from datetime import datetime, timezone
import logging
from uuid import UUID

from clickhouse_connect.driver.summary import QuerySummary
from db_dependencies import Clickhouse
from domains.premium_sources.sync.schemas import (
    PremiumRowIdsBatch,
    UnprocessedPremiumSourceRow,
)
from domains.premium_sources.sync_log.model import PremiumSourceSyncLogRecord
from resolver import injectable

logger = logging.getLogger(__name__)


@injectable
class PremiumSourceSyncLogPersistence:
    def __init__(self, click: Clickhouse) -> None:
        self.click = click
        self.table_name = "premium_sources_sync_log"

    def count(self, premium_source_sync_id: UUID, status: str) -> int:
        sql = f"""
        SELECT COUNT(*) AS count
        FROM {self.table_name} FINAL
        WHERE premium_source_sync_id = %(premium_source_sync_id)s
            AND synced = %(status)s
        """
        params = {
            "premium_source_sync_id": premium_source_sync_id,
            "status": status,
        }
        result = self.click.query(sql, parameters=params)
        return list(result.named_results())[0]["count"]

    def mark_unprocessed_batch(
        self,
        premium_source_id: UUID,
        premium_source_sync_id: UUID,
        max_batch_size: int,
    ) -> None:
        """
        Finds unsynced rows and inserts them into the log with 'in_progress' status.
        """

        # INSERT INTO premium_sources_sync_log(premium_source_id, row_id, premium_source_sync_id, synced, updated_at)
        # SELECT
        #     r.premium_source_id,
        #     r.row_id,
        #     'e9911f51-139c-4391-96b7-fb4294a2d926' AS premium_source_sync_id,
        #     'in_progress' AS synced,
        #     now()
        # FROM premium_sources_rows AS r
        # LEFT JOIN premium_sources_sync_log final AS s ON r.premium_source_id = s.premium_source_id
        #     AND r.row_id = s.row_id
        #     AND s.premium_source_sync_id = 'af9d2988-563f-4609-824d-9075708968f6'
        # WHERE r.premium_source_id = 'e9911f51-139c-4391-96b7-fb4294a2d926' AND s.row_id == 0
        # LIMIT 10
        sql = f"""
        INSERT INTO {self.table_name}(premium_source_id, row_id, premium_source_sync_id, synced, updated_at)
        SELECT
            r.premium_source_id,
            r.row_id,
            %(premium_source_sync_id)s AS premium_source_sync_id,
            'in_progress' AS synced,
            now()
        FROM premium_sources_rows AS r
        LEFT JOIN {self.table_name} AS s ON r.premium_source_id = s.premium_source_id
            AND r.row_id = s.row_id
            AND s.premium_source_sync_id = %(premium_source_sync_id)s
        WHERE r.premium_source_id = %(pid)s AND s.row_id == 0
        LIMIT {max_batch_size}
        """
        params = {
            "pid": premium_source_id,
            "premium_source_sync_id": premium_source_sync_id,
        }
        _ = self.click.command(sql, parameters=params)
        logger.info(f"Claimed a new batch for source {premium_source_id}.")

    def mark_processed_batch(
        self,
        row_ids_batch: PremiumRowIdsBatch,
    ) -> None:
        written_rows = self.mark_row_ids_batch_status(row_ids_batch, "synced")
        logger.info(
            f"Marked a batch of {written_rows} rows for source {row_ids_batch.premium_source_id} as processed."
        )

    def mark_failed_batch(
        self,
        row_ids_batch: PremiumRowIdsBatch,
        error_message: str,
    ):
        written_rows = self.mark_row_ids_batch_status(
            row_ids_batch, "failed", error_message
        )
        logger.info(
            f"Marked a batch of {written_rows} rows for source {row_ids_batch.premium_source_id} as failed."
        )

    def mark_row_ids_batch_status(
        self,
        row_ids_batch: PremiumRowIdsBatch,
        status: str,
        error_message: str | None = None,
    ) -> int:
        return self.mark_batch_status(
            row_ids_batch.premium_source_id,
            row_ids_batch.premium_source_sync_id,
            row_ids_batch.row_ids,
            status,
            error_message=error_message,
        )

    def mark_batch_status(
        self,
        premium_source_id: UUID,
        premium_source_sync_id: UUID,
        row_ids: list[int],
        status: str,
        error_message: str | None = None,
    ) -> int:
        updated_at = datetime.now(timezone.utc)

        new_rows = [
            PremiumSourceSyncLogRecord(
                premium_source_id=premium_source_id,
                premium_source_sync_id=premium_source_sync_id,
                row_id=row_id,
                synced=status,
                error_message=error_message,
                updated_at=updated_at,
            ).tuple()
            for row_id in row_ids
        ]

        summary = self.click.insert(table=self.table_name, data=new_rows)

        written_rows = summary.written_rows
        return written_rows

    def get_unprocessed_batch(
        self, premium_source_id: UUID, premium_source_sync_id: UUID
    ) -> list[UnprocessedPremiumSourceRow]:
        """
        Retrieves all rows for a given source that are currently marked as 'in_progress'.

        Note: uses `FINAL` due to table being powered by ReplacingMergeTree

        Details: https://clickhouse.com/docs/guides/replacing-merge-tree#querying-replacingmergetree
        """
        sql = f"""
        SELECT
            r.premium_source_id,
            r.row_id,
            r.sha256_email
        FROM premium_sources_rows AS r 
        INNER JOIN {self.table_name} AS s    ON r.premium_source_id = s.premium_source_id
            AND r.row_id = s.row_id
        WHERE s.premium_source_id = %(pid)s
            AND s.premium_source_sync_id = %(premium_source_sync_id)s
            AND s.synced = 'in_progress'
        SETTINGS final = 1
        """
        params = {
            "pid": premium_source_id,
            "premium_source_sync_id": premium_source_sync_id,
        }
        result = self.click.query(sql, parameters=params)
        return [
            UnprocessedPremiumSourceRow(**row) for row in result.named_results()
        ]
