import asyncio
import logging

from domains.premium_sources.sync.agent import PremiumSourceSyncAgent
from resolver import Resolver

logger = logging.getLogger(__name__)


async def interrupt_handler():
    resolver = Resolver()
    try:
        await main(resolver)
    except asyncio.CancelledError:
        logger.info("future cancelled")
    except KeyboardInterrupt:
        logger.info("Received interrupt")
    logger.info("Shutting down...")
    await resolver.cleanup()
    logger.info("Done")


async def main(resolver: Resolver):
    logger.info("Starting...")

    filler = await resolver.resolve(PremiumSourceSyncAgent)
    logger.info("Initialization completed")

    await filler.sync_batches()


if __name__ == "__main__":
    asyncio.run(interrupt_handler())
