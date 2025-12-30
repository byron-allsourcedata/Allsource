import os
import re

import httpx
import asyncio
import logging
import json
from typing import Optional

from config.util import getenv
from resolver import injectable

# Logger setup
logger = logging.getLogger(__name__)


def first_json_object(text: str):
    depth = 0
    start = None
    for i, c in enumerate(text):
        if c == "{":
            if depth == 0:
                start = i
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0 and start is not None:
                return text[start : i + 1]
    raise ValueError("No valid JSON object found")


@injectable
class DelivrClientAsync:
    BASE_URL = "https://api.delivr.ai/public/core/api"
    RETRY_COUNT = 3
    RETRY_DELAY = 20  # seconds

    def __init__(self):
        self.token = getenv("DELIVR_JWT_TOKEN")
        self.client_id = getenv("DELIVR_CLIENT_ID")
        self.client_secret = getenv("DELIVR_CLIENT_SECRET")
        self.organization_id = getenv("DELIVR_ORG_ID")

        if not all(
            [
                self.token,
                self.client_id,
                self.client_secret,
                self.organization_id,
            ]
        ):
            raise ValueError("All Delivr API env variables must be set")

    def _headers(self, extra_headers: Optional[dict] = None):
        headers = {
            "authorization": f"Bearer {self.token}",
            "content-type": "application/json",
            "X-Delivr-Client-ID": self.client_id,
            "X-Delivr-Client-Secret": self.client_secret,
            "organization_id": self.organization_id,
        }
        if extra_headers:
            headers.update(extra_headers)
        return headers

    async def _post(
        self,
        endpoint: str,
        json_payload: dict,
        extra_headers: Optional[dict] = None,
    ) -> dict:
        url = f"{self.BASE_URL}/{endpoint}"
        headers = self._headers(extra_headers)
        last_exception = None

        async with httpx.AsyncClient(timeout=10) as client:
            for attempt in range(1, self.RETRY_COUNT + 1):
                try:
                    response = await client.post(
                        url, json=json_payload, headers=headers
                    )
                    response.raise_for_status()

                    text = response.text.strip()
                    try:
                        data = json.loads(text)
                    except json.JSONDecodeError:
                        first_json = first_json_object(text)
                        data = json.loads(first_json)

                    if "response" not in data:
                        raise ValueError(
                            f"No 'response' key in API response: {data}"
                        )

                    return data["response"]

                except (
                    httpx.RequestError,
                    httpx.HTTPStatusError,
                    ValueError,
                ) as e:
                    last_exception = e
                    logger.error(
                        f"POST request to {url} failed: {e}. Attempt {attempt}/{self.RETRY_COUNT}"
                    )
                    await asyncio.sleep(self.RETRY_DELAY)

        logger.critical(
            f"POST request to {url} failed after {self.RETRY_COUNT} attempts"
        )
        raise last_exception

    async def create_project(
        self, company_name: str, email: Optional[str] = None
    ) -> str:
        payload = {"project": {"name": company_name}}
        if email:
            payload["project"]["email"] = email
        response = await self._post("project/create", payload)
        project_id = response.get("project_id")
        logger.info(f"Created project '{company_name}' with ID {project_id}")
        return project_id

    async def create_pixel(self, project_id: str, domain: str) -> str:
        payload = {"title": domain}
        response = await self._post(
            "pixel/create", payload, extra_headers={"project_id": project_id}
        )
        pixel_id = response.get("pixel_id")
        logger.info(f"Created pixel for domain '{domain}' with ID {pixel_id}")
        return pixel_id
