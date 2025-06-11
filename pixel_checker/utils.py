import logging
import os
from typing import Optional
from urllib.parse import urlparse

import httpx

logger = logging.getLogger(__name__)


def extract_domain(url: str) -> Optional[str]:
    if not url:
        return None

    try:
        parsed_url = urlparse(url)
    except Exception as e:
        logger.error(f"Failed to parse URL: {url}. Error: {str(e)}")
        return None

    domain = parsed_url.netloc

    if not domain:
        return None

    return domain


def get_domain_from_headers(referer: str, origin: str) -> Optional[str]:
    if origin:
        return extract_domain(origin)
    elif referer:
        return extract_domain(referer)
    return None


def get_env(key: str) -> str:
    var = os.getenv(key)

    if var is None:
        raise ValueError(f"Missing environment variable: {key}")

    return var


def get_http_client() -> httpx.AsyncClient:
    base_url = get_env("API_BASE_URL")
    return httpx.AsyncClient(base_url=base_url)
