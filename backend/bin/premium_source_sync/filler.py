import asyncio
import logging

from domains.premium_sources.sync.filler import PremiumSourceSyncFiller
from resolver import Resolver
from utils.bins import interrupt_handler

logger = logging.getLogger(__name__)


async def main(resolver: Resolver):
    logger.info("Starting...")
    logger.info("Initialization completed")
    try:
        while True:
            filler = await resolver.resolve(PremiumSourceSyncFiller)
            logger.info("filling queue")
            await filler.fill_processing_queue()
            logger.info("cleaning up...")
            await resolver.cleanup()
            logger.info("sleeping...")
            await asyncio.sleep(10)
    except Exception as e:
        logger.error(
            "Error while filling processing queue for premium source sync",
            exc_info=e,
        )


if __name__ == "__main__":
    asyncio.run(interrupt_handler(main))
