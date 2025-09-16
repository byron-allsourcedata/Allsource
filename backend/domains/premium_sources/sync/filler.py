import asyncio
import logging
from uuid import UUID
from sqlalchemy import select, update
from db_dependencies import Clickhouse, Db
from domains.premium_sources.sync.schemas import (
    UnprocessedPremiumSourceBatch,
    UnprocessedPremiumSourceRow,
)
from domains.premium_sources.sync.sync_queue import (
    PremiumSourceSyncQueueService,
)
from domains.premium_sources.sync_log.persistence import (
    PremiumSourceSyncLogPersistence,
)
from models.integrations.users_domains_integrations import UserIntegration
from models.premium_source import PremiumSource
from models.premium_source_sync import PremiumSourceSync
from resolver import injectable
from domains.premium_sources.sync.config import (
    FILLER_CONCURRENCY,
    META_BATCH_SIZE,
    GOOGLE_BATCH_SIZE,
)


logger = logging.getLogger(__name__)


@injectable
class PremiumSourceSyncFiller:
    """
    Prepares batches of unsynced source rows for syncs.

    This class identifies premium sources that are not fully processed, claims a batch
    of unsynced rows by marking them as 'in_progress' in a log table, retrieves
    this batch, and sends it for further processing.
    """

    def __init__(
        self,
        db: Db,
        clickhouse: Clickhouse,
        queue: PremiumSourceSyncQueueService,
        sync_log: PremiumSourceSyncLogPersistence,
    ) -> None:
        self.db = db
        self.clickhouse = clickhouse
        self.queue = queue
        self.sync_log = sync_log

    async def fill_processing_queue(self):
        await self.queue.init()
        unprocessed_syncs = self.get_unprocessed_syncs()
        await self.handle_batches_for_syncs(unprocessed_syncs)
        logger.info("queue was closed")

    def get_unprocessed_syncs(self):
        """
        Fetches all premium sources not marked as 'done', and processes a batch for each.
        """
        unprocessed_source_ids = list(
            self.db.execute(
                select(
                    PremiumSourceSync.id,
                    PremiumSourceSync.premium_source_id,
                    PremiumSourceSync.user_integration_id,
                )
                .join(
                    UserIntegration,
                    PremiumSourceSync.user_integration_id == UserIntegration.id,
                )
                .where(PremiumSourceSync.status != "done")
            ).tuples()
        )

        return unprocessed_source_ids

    async def handle_batches_for_syncs(
        self, unprocessed_syncs: list[tuple[UUID, UUID, int]]
    ):
        sem = asyncio.Semaphore(FILLER_CONCURRENCY)
        tasks = []
        for (
            sync_id,
            premium_source_id,
            user_integration_id,
        ) in unprocessed_syncs:
            tasks.append(
                asyncio.create_task(
                    self._handle_one_sync(
                        sem, sync_id, premium_source_id, user_integration_id
                    )
                )
            )
        await asyncio.gather(*tasks)

    async def _handle_one_sync(
        self, sem, sync_id, premium_source_id, user_integration_id
    ):
        async with sem:
            logger.info(
                f"Checking for unprocessed rows for sync {sync_id} in source {premium_source_id}."
            )

            in_progress_rows = self.sync_log.get_unprocessed_batch(
                premium_source_id, sync_id
            )
            if len(in_progress_rows) > 0:
                logger.info(
                    f"sync {sync_id} already has in-progress rows: {len(in_progress_rows)}"
                )
                return

            integration = self.db.execute(
                select(UserIntegration).where(
                    UserIntegration.id == user_integration_id
                )
            ).scalar_one_or_none()
            if integration and integration.service_name == "google_ads":
                batch_size = GOOGLE_BATCH_SIZE
            else:
                batch_size = META_BATCH_SIZE

            self.sync_log.mark_unprocessed_batch(
                premium_source_id, sync_id, batch_size
            )

            rows = self.sync_log.get_unprocessed_batch(
                premium_source_id, sync_id
            )

            if not rows:
                self.mark_source_as_done(premium_source_id)
                return

            batch = UnprocessedPremiumSourceBatch(
                premium_source_id=premium_source_id,
                premium_source_sync_id=sync_id,
                rows=rows,
            )
            await self.send_batch_for_processing(batch)

    def claim_unprocessed_batch(
        self,
        premium_source_sync_id: UUID,
        premium_source_id: UUID,
        user_integration_id: int,
        max_batch_size: int,
    ) -> UnprocessedPremiumSourceBatch:
        """
        marks unprocessed rows for this sync and fetches them
        """
        self.sync_log.mark_unprocessed_batch(
            premium_source_id, premium_source_sync_id, max_batch_size
        )
        rows = self.sync_log.get_unprocessed_batch(
            premium_source_id, premium_source_sync_id
        )
        return UnprocessedPremiumSourceBatch(
            premium_source_id=premium_source_id,
            premium_source_sync_id=premium_source_sync_id,
            rows=rows,
        )

    async def send_batch_for_processing(
        self, batch: UnprocessedPremiumSourceBatch
    ):
        """
        Sends the batch of unprocessed rows to a downstream service.
        """
        if not batch.rows:
            return
        logger.info(
            f"Sending batch of {len(batch.rows)} rows for processing from source {batch.premium_source_id}."
        )

        await self.queue.publish(batch)

    def mark_source_as_done(self, premium_source_id: UUID) -> None:
        """
        Updates the status of a PremiumSource to 'done' in the primary database.
        """
        logger.info(
            f"Premium source sync ({premium_source_id}) is complete. Marking it as 'done'."
        )
        stmt = (
            update(PremiumSource)
            .where(PremiumSource.id == premium_source_id)
            .values(status="done")
        )

        _ = self.db.execute(stmt)
