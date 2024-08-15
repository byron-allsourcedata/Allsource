from sqlalchemy.orm import Session
from fastapi import HTTPException
from httpx import Client
from models.users import User
from persistence.users_integrations_persistence import UserIntegrationsPresistence
from schemas.integrations import Customer

class ShopifyIntegrationService:

    shopify_api_customers = '/admin/api/2024-07/customers.json'

    def __init__(self, db: Session, user_integration_persistence: UserIntegrationsPresistence, client: Client, user: User):
        self.user_integration_persistence = user_integration_persistence
        self.db = db
        self.client = client
        self.user = user



    def get_customers(self, shop_domain: str, access_token: str):
        customers_url = f'https://{shop_domain}.myshopify.com{self.shopify_api_customers}'
        response = self.client.get(customers_url, headers={'X-Shopify-Access-Token': access_token})
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail='Invalid shop name or access token')

        customers_data = response.json().get('customers')

        customers = [Customer(email=customer['email'], 
                              first_name=customer['first_name'],
                              last_name=customer['last_name'],
                              phone=customer['phone']) for customer in customers_data]

        return customers


    def create_integration(self, shop_domain: str, access_token: str):
        integration = self.user_integration_persistence.create_integration({
            'user_id': self.user.id,
            'shop_domain': shop_domain,
            'access_token': access_token,
            'service_name': 'shopify'
        })
        return self.get_customers(integration.shop_domain, integration.access_token)
