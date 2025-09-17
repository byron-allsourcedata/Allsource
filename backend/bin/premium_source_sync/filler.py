import asyncio
import logging

from domains.premium_sources.sync.filler import PremiumSourceSyncFiller
from resolver import Resolver
from utils.bins import interrupt_handler

logger = logging.getLogger(__name__)


async def try_cleanup(resolver: Resolver):
    try:
        await resolver.cleanup()
    except Exception as e:
        logger.error("Error while cleaning up", exc_info=e)


async def main(resolver: Resolver):
    logger.info("Starting...")
    filler = await resolver.resolve(PremiumSourceSyncFiller)
    await filler.queue.init()
    logger.info("Initialization completed")

    try:
        while True:
            try:
                logger.debug("filling queue")
                did_publish = await filler.fill_processing_queue()

                if did_publish:
                    await asyncio.sleep(1)
                else:
                    logger.info("Still no work to publish")
                    await asyncio.sleep(15)

            except Exception as e:
                logger.error(
                    "Error while filling processing queue for premium source sync",
                    exc_info=e,
                )
                await try_cleanup(resolver)
    finally:
        logger.info("Final cleanup...")
        await try_cleanup(resolver)


if __name__ == "__main__":
    asyncio.run(interrupt_handler(main))
