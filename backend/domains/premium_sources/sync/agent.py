from asyncio import sleep
import logging

from aio_pika import IncomingMessage
from aio_pika.abc import AbstractIncomingMessage
from aio_pika.exceptions import QueueEmpty
from domains.premium_sources.sync.utils import run_blocking
from domains.premium_sources.sync.integrations.google_ads import (
    GoogleAdsPremiumSourceSyncService,
)
from domains.premium_sources.sync.integrations.meta import (
    MetaPremiumSourceSyncService,
)
from domains.premium_sources.sync.schemas import UnprocessedPremiumSourceBatch
from domains.premium_sources.sync.sync_queue import (
    PremiumSourceSyncQueueService,
)
from domains.premium_sources.sync_log.persistence import (
    PremiumSourceSyncLogPersistence,
)
from resolver import injectable

logger = logging.getLogger(__name__)


@injectable
class PremiumSourceSyncAgent:
    def __init__(
        self,
        sync_queue: PremiumSourceSyncQueueService,
        sync_log: PremiumSourceSyncLogPersistence,
        meta: MetaPremiumSourceSyncService,
        google_ads: GoogleAdsPremiumSourceSyncService,
    ) -> None:
        self.google_ads = google_ads
        self.meta = meta
        self.sync_queue = sync_queue
        self.sync_log = sync_log

    async def sync_batches(self):
        await self.sync_queue.init()
        try:
            await self.sync_queue.consume(self.parse_and_sync_batch)
        except Exception:
            await sleep(5)
            logger.error("error", exc_info=True)

    async def parse_and_sync_batch(self, message: AbstractIncomingMessage):
        logger.info("received message")
        batch = self.sync_queue.parse_message(message)
        logger.info(f"started work on {batch.premium_source_sync_id} sync")
        try:
            await self.sync_batch(batch)
        except Exception:
            logger.exception("sync_batch failed, nack and requeue")
            try:
                await message.nack(requeue=True)
            except Exception:
                logger.exception("failed to nack message")
            return
        logger.info("done with message")
        await message.ack()

    async def sync_batch(self, batch: UnprocessedPremiumSourceBatch):
        # row ids for marking processed
        row_ids_batch = batch.to_row_ids_batch()

        # Google path
        google_sync_details = self.google_ads.fetch_sync_details(
            batch.premium_source_sync_id
        )
        if google_sync_details:
            logger.info("syncing to google ads")
            # google sync method should be async (see next section). If it's blocking, it will internally run in executor.
            await self.google_ads.sync_premium_source_batch(batch)
            # mark processed in thread pool (blocking ClickHouse insert)
            await run_blocking(
                self.sync_log.mark_processed_batch, row_ids_batch
            )
            logger.info("marked rows as processed")
            return

        # Meta path
        meta_sync_details = self.meta.fetch_sync_details(
            batch.premium_source_sync_id
        )
        if meta_sync_details:
            logger.info("syncing to meta")
            await self.meta.sync_premium_source_batch(batch)
            await run_blocking(
                self.sync_log.mark_processed_batch, row_ids_batch
            )
            logger.info("marked rows as processed")
            return

        logger.info(
            "no sync details were found for this batch, marking as failed"
        )
        await run_blocking(
            self.sync_log.mark_failed_batch,
            row_ids_batch,
            "no sync details were found for this batch",
        )
