import logging
from typing import Optional

from dotenv import load_dotenv
import httpx

from schemas import DomainsListResponse, PixelInstallationRequest
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


async def fetch_external_data(request_data: PixelInstallationRequest) -> None:
    async with get_http_client() as client:
        response = await client.post(
            "/external_api/install-pixel/check-pixel-installed",
            json=request_data.dict()
        )
        if response.status_code == 200:
            logger.info(
                "Pixel check succeeded for client_id=%s, domain=%s",
                request_data.pixelClientId,
                request_data.url
            )
        else:
            logger.error(
                "Pixel check failed for client_id=%s, domain=%s: %d %s",
                request_data.pixelClientId,
                request_data.url,
                response.status_code,
                response.text
            )
