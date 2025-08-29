import asyncio
import hashlib
import io
import logging
import os

import httpcore
import httpx

from persistence.million_verifier import MillionVerifierPersistence
from resolver import injectable
from services.exceptions import InsufficientCreditsError, MillionVerifierError

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
        self.bulk_api_url = "https://bulkapi.millionverifier.com/bulkapi/v2/"

    async def __async_handle_request(
        self,
        method: str,
        url: str,
        json: dict | None = None,
        params: dict | None = None,
        files: dict | None = None,
        stream: bool = False,
        max_retries: int = 1,
        retry_delay: float = 2.0,
    ):
        headers = {
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
                        files=files,
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

                if stream:
                    return response

                return response.json()

            except (
                httpx.ConnectTimeout,
                httpx.ReadTimeout,
                httpcore.ConnectError,
            ) as e:
                logging.warning(
                    f"Temporary network error: {type(e).__name__} - {e}"
                )
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

    # ---------- SINGLE API ----------

    async def is_email_verify(self, email: str):
        is_verify = False
        checked_email = self.million_verifier_persistence.find_checked_email(
            email=email
        )
        if checked_email:
            return checked_email.is_verify

        result = await self.__check_verify_email(email)

        if result.get("credits") <= 0:
            raise InsufficientCreditsError(
                "Insufficient credits for million_verifier"
            )

        if result.get("error"):
            raise MillionVerifierError(result.get("error"))

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

    # ---------- BULK API ----------

    async def bulk_upload_file(
        self, file_content: str, origin_aud_id: str, md5_hash: str
    ) -> dict:
        url = f"{self.bulk_api_url}upload"
        params = {"key": self.api_key}

        # создаём in-memory файл
        fake_file = io.BytesIO(file_content.encode("utf-8"))
        fake_file.seek(0)
        files = {"file_contents": ("emails.txt", fake_file, "text/plain")}

        response = await self.__async_handle_request(
            method="POST", url=url, params=params, files=files
        )

        logging.error(f"MillionVerifier upload response: {response}")

        if response.get("error"):
            raise MillionVerifierError(response["error"])

        file_id = response.get("file_id")
        if file_id:
            self.million_verifier_persistence.save_file_record(
                file_id=int(file_id),
                md5_hash=md5_hash,
                origin_aud_id=origin_aud_id,
                is_ready=(response.get("status") == "finished"),
            )

        return response

    async def bulk_file_info(self, file_id: str) -> dict:
        url = f"{self.bulk_api_url}fileinfo"
        params = {"key": self.api_key, "file_id": file_id}

        response = await self.__async_handle_request(
            method="GET", url=url, params=params
        )

        return response

    async def bulk_download_report(
        self, file_id: str, filter_type: str = "all"
    ) -> str | dict:
        url = f"{self.bulk_api_url}download"
        params = {
            "key": self.api_key,
            "file_id": file_id,
            "filter": filter_type,
        }

        response = await self.__async_handle_request(
            method="GET", url=url, params=params, stream=True
        )

        if isinstance(response, dict) and response.get("error"):
            return response

        return response.content.decode("utf-8")
