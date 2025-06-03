from typing import Annotated

import httpx
from fastapi import Depends

from config.hubspot import HubspotConfig


def get_hubspot_client():
    if not HubspotConfig.is_enabled():
        return httpx.Client()
    token = HubspotConfig.api_key
    client = httpx.Client()
    client.headers["Authorization"] = f"Bearer {token}"
    client.headers["Content-Type"] = "application/json"
    return client

HubspotClient = Annotated[httpx.Client, Depends(get_hubspot_client)]