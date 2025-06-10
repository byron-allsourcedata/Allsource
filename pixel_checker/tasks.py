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
CHECK_PIXEL_URL = os.getenv("GET_CHECK_PIXEL_INSTALLATION_STATUS")


async def fetch_domains_with_secret() -> Optional[DomainsListResponse]:
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(GET_DOMAINS_URL, params={"secret_key": SECRET_KEY})
            response.raise_for_status()
            data = response.json()

            if isinstance(data, dict) and "domains" in data:
                return DomainsListResponse(domains=data["domains"])

            logger.error(f"Unexpected response format: {data}")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"Request failed with status {e.response.status_code}: {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"An error occurred: {str(e)}")
            return None


async def fetch_external_data(domain: str) -> None:
    async with httpx.AsyncClient() as client:
        response = await client.get(CHECK_PIXEL_URL, params={"domain": domain})
        if response.status_code == 200:
            logger.info(f"Successfully fetched pixel installation status for domain: {domain}")
        else:
            logger.error(f"Failed to fetch pixel installation status for domain: {domain}")
