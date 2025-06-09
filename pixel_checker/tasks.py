import os
import time
import logging
from typing import Optional

from dotenv import load_dotenv
import httpx

from schemas import DomainsListResponse

load_dotenv()
logger = logging.getLogger(__name__)

GET_DOMAINS_URL = os.getenv("GET_DOMAINS_URL")
SECRET_KEY = os.getenv("SECRET_KEY")

def long_task():
    time.sleep(5)
    logger.info("Completed background task")

async def fetch_domains_with_secret() -> Optional[DomainsListResponse]:
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(GET_DOMAINS_URL, params={"secret_key": SECRET_KEY})
            response.raise_for_status()
            data = response.json()

            if isinstance(data, dict) and 'domains' in data:
                return DomainsListResponse(domains=data['domains'])

            logger.error(f"Unexpected response format: {data}")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"Request failed with status {e.response.status_code}: {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"An error occurred: {str(e)}")
            return None

async def fetch_external_data():
    async with httpx.AsyncClient() as client:
        response = await client.get("http://127.0.0.1:8000/referer-cache")
        long_task()
        if response.status_code == 200:
            logger.info("Successfully fetched data from /referer-cache")
        else:
            logger.error("Failed to fetch data from /referer-cache")
