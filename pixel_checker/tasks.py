import logging

from dotenv import load_dotenv
import httpx
from uuid import UUID

from schemas import PixelsResponse, PixelInstallationRequest
from utils import get_env, get_http_client

load_dotenv()

logger = logging.getLogger(__name__)

SECRET_PIXEL_KEY = get_env("SECRET_PIXEL_KEY")


async def fetch_domains_with_secret() -> PixelsResponse | None:
    async with get_http_client() as client:
        try:
            response = await client.get(
                "/api/install-pixel/verified-pixels",
                params={"secret_key": SECRET_PIXEL_KEY},
            )
            response.raise_for_status()
            data = response.json()

            payload = {}

            if isinstance(data, dict):
                if "pixel_ids" in data and data["pixel_ids"] is not None:
                    payload["pixel_ids"] = [UUID(x) if not isinstance(x, UUID) else x for x in data["pixel_ids"]]

                if "data_providers_ids" in data and data["data_providers_ids"] is not None:
                    payload["data_providers_ids"] = [str(x) for x in data["data_providers_ids"]]

                if payload:
                    return PixelsResponse(**payload)

            logger.error(f"Unexpected response format: {data}")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(
                f"Request failed with status {e.response.status_code}: {e.response.text}"
            )
            return None
        except Exception as e:
            logger.error(f"An error occurred: {str(e)}")
            return None


async def fetch_external_data(request_data: PixelInstallationRequest) -> None:
    data = request_data.dict()
    if data["pixelClientId"] is not None:
        data["pixelClientId"] = str(data["pixelClientId"])
    async with get_http_client() as client:
        response = await client.post(
            "/external_api/install-pixel/check-pixel-installed",
            json=data,
        )
        if response.status_code == 200:
            logger.info(
                "Pixel check succeeded for client_id=%s, domain=%s",
                request_data.pixelClientId,
                request_data.url,
            )
        else:
            logger.error(
                "Pixel check failed for client_id=%s, domain=%s: %d %s",
                request_data.pixelClientId,
                request_data.url,
                response.status_code,
                response.text,
            )
