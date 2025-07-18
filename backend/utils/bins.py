from asyncio import sleep
from collections.abc import Coroutine
import logging
from typing import Any, Callable


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
