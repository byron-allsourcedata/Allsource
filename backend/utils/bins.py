from asyncio import sleep
import asyncio
from collections.abc import Awaitable, Coroutine
import logging
from typing import Any, Callable

from resolver import Resolver

logger = logging.getLogger(__name__)


def handle_interrupt(logger: logging.Logger | None = None):
    if logger is not None:
        logger.info("Received KeyboardInterrupt")
    else:
        logging.info("Received KeyboardInterrupt")


async def infinite_loop(
    main: Coroutine[Any, Any, None], sleep_seconds: int = 60
):
    while True:
        try:
            await main
        except KeyboardInterrupt:
            handle_interrupt()
        except BaseException:
            pass
        finally:
            pass
        await sleep(sleep_seconds)


def wrap_with_keyboard_interrupt(func: Callable[..., None]):
    try:
        func()
    except KeyboardInterrupt:
        handle_interrupt()


async def interrupt_handler(
    script_main: Callable[[Resolver], Awaitable[None]],
):
    resolver = Resolver()
    try:
        await script_main(resolver)
    except asyncio.CancelledError:
        logger.info("Future was cancelled")
    except KeyboardInterrupt:
        logger.info("Received interrupt")
    logger.info("Shutting down...")
    await resolver.cleanup()
    logger.info("Done")
