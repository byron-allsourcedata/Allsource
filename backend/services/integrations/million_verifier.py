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
        self, method: str, url: str, json: dict = None, params: dict = None
    ):
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=json,
                    params=params,
                )
            return response

        except httpx.ConnectTimeout:
            logging.error(f"Timeout when connecting to {url}")
            return {"error": "Timeout"}

        except httpcore.ConnectError as e:
            logging.error(f"Connection error to {url}: {e}")
            return {"error": "Connection error"}

        except httpx.ReadError as e:
            logging.error(f"Read error from {url}: {e}")
            return {"error": "Read error"}

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                logging.warning(e.response.headers)
                retry_after = int(e.response.headers.get("Retry-After", 1))
                logging.warning(
                    f"Rate limit exceeded. Retrying after {retry_after} seconds."
                )
            else:
                logging.error(f"HTTP error occurred: {e}")
            return {"error": "HTTP status error"}

        except httpx.RequestError as e:
            logging.error(
                f"Request failed: {type(e).__name__} - {e!s} (URL: {url})"
            )
            return {"error": "Request failed"}

        return response

    async def is_email_verify(self, email: str):
        is_verify = False
        checked_email = self.million_verifier_persistence.find_checked_email(
            email=email
        )
        if checked_email:
            return checked_email.is_verify

        result = self.__check_verify_email(email)
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
        if response.get("error"):
            return response

        return response.json()
