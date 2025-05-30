from config.util import getenv


class HubspotConfig:
    api_key = getenv("HUBSPOT_API_KEY")
    base_url = getenv("HUBSPOT_BASE_URL")
    enabled = getenv("HUBSPOT_ENABLED") == "true"