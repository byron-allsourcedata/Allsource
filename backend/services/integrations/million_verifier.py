import asyncio

import httpcore
import requests
import os
import logging

from gql.transport import httpx

from persistence.million_verifier import MillionVerifierPersistence
from resolver import injectable

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@injectable
class MillionVerifierIntegrationsService:
    def __init__(
        self, million_verifier_persistence: MillionVerifierPersistence
    ):
        self.million_verifier_persistence = million_verifier_persistence
        self.api_key = os.getenv("MILLION_VERIFIER_KEY")
        self.api_url = "https://api.millionverifier.com/api/v3/"

    async def __async_handle_request(
        self,
        method: str,
        url: str,
        json: dict = None,
        params: dict = None,
        max_retries: int = 1,
        retry_delay: float = 2.0,
    ):
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        attempt = 0
        while attempt <= max_retries:
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.request(
                        method=method,
                        url=url,
                        headers=headers,
                        json=json,
                        params=params,
                    )

                if response.status_code == 429:
                    retry_after = int(
                        response.headers.get("Retry-After", retry_delay)
                    )
                    logging.warning(
                        f"Rate limited. Retrying after {retry_after} seconds..."
                    )
                    await asyncio.sleep(retry_after)
                    attempt += 1
                    continue

                return await response.json()

            except (
                httpx.ConnectTimeout,
                httpcore.ConnectError,
                httpx.ReadError,
            ) as e:
                logging.warning(f"Temporary error: {type(e).__name__} - {e}")
                if attempt < max_retries:
                    logging.info(f"Retrying in {retry_delay} seconds...")
                    await asyncio.sleep(retry_delay)
                    attempt += 1
                    continue
                else:
                    return {"error": str(e)}

            except httpx.RequestError as e:
                logging.error(
                    f"Request failed: {type(e).__name__} - {e!s} (URL: {url})"
                )
                return {"error": "Request failed"}

            except Exception as e:
                logging.error(f"Unexpected error: {e}")
                return {"error": str(e)}

        return {"error": "Max retries exceeded"}

    async def is_email_verify(self, email: str):
        is_verify = False
        checked_email = self.million_verifier_persistence.find_checked_email(
            email=email
        )
        if checked_email:
            return checked_email.is_verify

        result = await self.__check_verify_email(email)
        if result.get("error"):
            return False

        if result.get("credits") == 0:
            logger.warning(result.get("error"))
            raise Exception(f"Insufficient credits for million_verifier")

        subresult_value = result.get("subresult")

        if subresult_value == "ok":
            is_verify = True

        if result.get("resultcode") in (3, 4, 5, 6):
            error_text = result.get("error")
            result_error = result.get("result")
            is_verify = False
            if error_text:
                logger.debug(f"millionverifier error: {error_text}")
            if result_error:
                logger.debug(f"millionverifier error: {result_error}")

        self.million_verifier_persistence.save_checked_email(
            email=email, is_verify=is_verify, verify_result=subresult_value
        )
        return is_verify

    async def __check_verify_email(self, email: str) -> dict:
        params = {"email": email, "api": self.api_key}

        response = await self.__async_handle_request(
            method="GET", url=self.api_url, params=params
        )

        return response
