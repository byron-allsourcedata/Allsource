from sqlalchemy.orm import Session
from fastapi import HTTPException
from httpx import Client
from models.users import User
from persistence.users_integrations_persistence import UserIntegrationsPresistence
from .utils import mapped_customers

class BigcommerceIntegrationService:

    def __init__(self, db: Session, user_integration_persistence: UserIntegrationsPresistence, client: Client, user: User):
        self.user_integration_persistence = user_integration_persistence
        self.db = db
        self.client = client
        self.user = user


    def get_customers(self, shop_domain: str, access_token: str):
        customers_url = f'https://api.bigcommerce.com/stores/{shop_domain}/v3/customers'
        response = self.client.get(customers_url, headers={'X-Auth-Token': access_token})
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail='Invalid store_hash or Auth-Token')
        customers = response.json().get('customers')
        return mapped_customers('bigcommerce',customers)


    def create_integration(self, shop_domain: str, access_token: str):
        integration = self.user_integration_persistence.create_integration({
            'user_id': self.user.id,
            'shop_domain': shop_domain,
            'access_token': access_token,
            'service_name': 'bigcommerce'
        })
        return self.get_customers(integration.shop_domain, integration.access_token)
