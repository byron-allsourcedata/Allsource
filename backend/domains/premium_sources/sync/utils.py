import asyncio
from concurrent.futures import ThreadPoolExecutor
from domains.premium_sources.sync.config import THREADPOOL_MAX_WORKERS

_executor = ThreadPoolExecutor(max_workers=THREADPOOL_MAX_WORKERS)


async def run_blocking(func, *args, **kwargs):
    """
    Run blocking function in threadpool and return result.
    """
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(_executor, lambda: func(*args, **kwargs))
