import time
import logging

import httpx

logger = logging.getLogger(__name__)

def long_task(item_id: int):
    time.sleep(5)
    logger.info(f"Completed background task for item {item_id}")

async def fetch_external_data(item_id: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"http://127.0.0.1:8000/external/{item_id}")
        long_task(item_id)
        if response.status_code == 200:
            logger.info(f"Successfully fetched data for item {item_id}")
        else:
            logger.error(f"Failed to fetch data for item {item_id}")
