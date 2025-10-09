import re
from urllib.parse import urlparse


def to_snake_case(name: str) -> str:
    # Strip leading/trailing spaces
    name = name.strip()

    # Remove non-latin letters, keep a-z, A-Z, 0-9, and spaces
    name = re.sub(r"[^a-zA-Z0-9 ]+", "", name)

    if not name:
        return "_"

    name = re.sub(r"\s+", "_", name)

    return name.lower()


def normalize_host_raw(host: str) -> str:
    if not host:
        return ""
    h = host.strip().lower()
    if h.startswith("http://") or h.startswith("https://"):
        try:
            parsed = urlparse(h)
            h = parsed.netloc or parsed.path
        except Exception:
            h = h.replace("http://", "").replace("https://", "")
    h = h.split("/")[0]
    if h.startswith("www."):
        h = h[4:]
    if ":" in h:
        h = h.split(":")[0]
    return h
