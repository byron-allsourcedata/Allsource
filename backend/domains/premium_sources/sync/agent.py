from asyncio import sleep
import logging

from aio_pika import IncomingMessage
from aio_pika.abc import AbstractIncomingMessage
from aio_pika.exceptions import QueueEmpty
from domains.premium_sources.sync.integrations.google_ads import (
    GoogleAdsPremiumSourceSyncService,
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
        google_ads: GoogleAdsPremiumSourceSyncService,
    ) -> None:
        self.google_ads = google_ads
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
        self.sync_batch(batch)
        logger.info("done with message")
        await message.ack()

    def sync_batch(self, batch: UnprocessedPremiumSourceBatch):
        # get premium source sync
        # route to google ads / meta
        # wait for response
        # mark those rows in db
        sync_id = batch.premium_source_sync_id
        row_ids_batch = batch.to_row_ids_batch()

        google_sync_details = self.google_ads.fetch_sync_details(sync_id)

        if google_sync_details:
            self.google_ads.sync_premium_source_batch(batch)
            logging.info("marking rows as processed")
            self.sync_log.mark_processed_batch(row_ids_batch)
            logging.info("marked rows as processed")
            return
        logger.info(
            "no google sync details were found for this batch, marking as failed"
        )

        self.sync_log.mark_failed_batch(
            row_ids_batch,
            error_message="no google sync details were found for this batch",
        )
