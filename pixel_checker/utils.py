import logging
from typing import Optional
from urllib.parse import urlparse

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
