import time
import logging

import httpx

logger = logging.getLogger(__name__)

def long_task():
    time.sleep(5)
    logger.info("Completed background task")


async def fetch_external_data():
    async with httpx.AsyncClient() as client:
        response = await client.get("http://127.0.0.1:8000/referer-cache")
        long_task()
        if response.status_code == 200:
            logger.info("Successfully fetched data from /referer-cache")
        else:
            logger.error("Failed to fetch data from /referer-cache")
