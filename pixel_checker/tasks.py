import logging
from typing import Optional

from dotenv import load_dotenv
import httpx

from schemas import DomainsListResponse
from utils import get_env, get_http_client

load_dotenv()

logger = logging.getLogger(__name__)

SECRET_PIXEL_KEY = get_env("SECRET_PIXEL_KEY")


async def fetch_domains_with_secret() -> Optional[DomainsListResponse]:
    async with get_http_client() as client:
        try:
            response = await client.get("/api/install-pixel/verified_domains", params={"secret_key": SECRET_PIXEL_KEY})
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
    async with get_http_client() as client:
        response = await client.get("/external_api/install-pixel/check-pixel-installed", params={"domain": domain})
        if response.status_code == 200:
            logger.info(f"Successfully fetched pixel installation status for domain: {domain}")
        else:
            logger.error(f"Failed to fetch pixel installation status for domain: {domain}")
