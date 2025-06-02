from config.util import getenv


class HubspotConfig:
    @classmethod
    def init(cls):
        cls.api_key = getenv("HUBSPOT_API_KEY")
        cls.base_url = getenv("HUBSPOT_BASE_URL")

    @classmethod
    def is_enabled(cls):
        return cls.api_key is not None and cls.base_url is not None
