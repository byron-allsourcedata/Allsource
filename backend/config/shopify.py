import os

from .base import Base


class ShopifyConfig(Base):
    app = "Maximiz"
    key = os.getenv("SHOPIFY_KEY")
    secret = os.getenv("SHOPIFY_SECRET")
    scopes = [
        "read_products",
        "read_script_tags",
        "write_script_tags",
    ]
    callback_uri = f"{os.getenv('SITE_HOST_URL')}/shopify-landing"
    api_version = "2024-10"
