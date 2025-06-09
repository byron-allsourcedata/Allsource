from typing import Optional
from urllib.parse import urlparse


def extract_domain(url: str) -> Optional[str]:
    if not url:
        return None

    parsed_url = urlparse(url)
    domain = parsed_url.netloc

    if not domain:
        return None

    return domain

def get_domain_from_headers(referer: str, origin: str) -> Optional[str]:
    domain = None
    if referer:
        domain = extract_domain(referer)
    if not domain and origin:
        domain = extract_domain(origin)

    return domain