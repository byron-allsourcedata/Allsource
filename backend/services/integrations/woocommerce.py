from models.users import User
from persistence.users_integrations_persistence import UserIntegrationsPresistence
from sqlalchemy.orm import Session
from woocommerce import API
from .utils import mapped_customers


class WoocommerceIntegrationService:

    def __init__(self, db: Session, user_integration_persistence: UserIntegrationsPresistence, user):
        self.user_integration_persistence = user_integration_persistence
        self.db = db
        self.user = user


    def get_customers(self, url: str, consumer_key: str, consumer_secret: str):
        wcapi = API(url, consumer_key, consumer_secret, wp_api=True, version="wc/v3")
        customers = wcapi.get("customers").json()
        return mapped_customers('woocommerce', customers)


    def create_integration(self, url: str, consumer_key: str, consumer_secret: str):
        self.user_integration_persistence.create_integration({
            'shop_domain': url,
            'user_id': self.user['id'],
            'consumer_key': consumer_key,
            'consumer_secret': consumer_secret,
            'service_name': 'woocommerce'
        })