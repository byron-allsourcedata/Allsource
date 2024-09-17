from typing import List
from sqlalchemy.orm import Session
from schemas.integrations.integrations import IntegrationCredentials
from schemas.integrations.bigcommerce import BigCommerceUserScheme
from persistence.leads_persistence import LeadsPersistence
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from httpx import Client
from fastapi import HTTPException
from datetime import datetime

class BigcommerceIntegrationsService:

    def __init__(self, integrations_persistence: IntegrationsPresistence, leads_persistence: LeadsPersistence, client: Client):
        self.integrations_persistence = integrations_persistence
        self.leads_persistence = leads_persistence
        self.client = client

    def __get_credentials(self, user_id: int):
        with self.integrations_persistence as service:
            return service.get_credentials_for_service(user_id, 'BigCommerce')

    def __get_customers(self, shop_hash: str, access_token: str) -> List[dict]:
        response = self.client.get(f'https://api.bigcommerce.com/stores/{shop_hash}/v3/customers', headers={'X-Auth-Token': access_token})
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.json().get('errors')[0].get('detail'))
        return response.json().get('data')

    def __save_integration(self, shop_hash: str, access_token: str, user_id: int):
        credentials = {'user_id': user_id, 'shop_domain': shop_hash, 'access_token': access_token, 'service_name': 'BigCommerce'}
        with self.integrations_persistence as service:
            integration = service.create_integration(credentials)
            if not integration:
                raise HTTPException(status_code=409, detail='Integration already exists')
            return integration

    def __save_customer(self, customer: BigCommerceUserScheme, user_id: int):
        with self.integrations_persistence as service:
            service.bigcommerce.save_customer(customer.model_dump(), user_id)

    def __get_shop_info(self, shop_hash, api_key: str):
        response = self.client.get(f'https://api.bigcommerce.com/stores/{shop_hash}/v2/store',
                                   headers={
                                       'X-Auth-Token': api_key
                                   })
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail={'status': 'error', 'detail': {'message': 'Credentials invalid'}})
        return response.json()
    

    def add_integration(self, user, domain, credentials: IntegrationCredentials):
        shop_info = self.__get_shop_info()
        if user['company_website '] != shop_info['domain']:
            raise HTTPException(status_code=400, detail={'status': 'error', 'detail': {
                'message': 'This Store does not match the one you specified earlier'
            }})
        customers = [self.__mapped_customer(customer) for customer in self.__get_customers(credentials.bigcommerce.shop_domain, credentials.bigcommerce.access_token)]
        integration = self.__save_integration(credentials.bigcommerce.shop_domain, credentials.bigcommerce.access_token, domain.id)
        # for customer in customers:
        #     self.__save_customer(customer, user['id'])
        return {
            'status': 'Successfully added',
            'detail': {
                'id': integration.id,
                'service_name': 'BigCommerce'
            }
        }

# -------------------------------MAPPED-BIGCOMMERCE-DATA------------------------------------ #


    def __mapped_customer(self, customer: dict) -> BigCommerceUserScheme:
        return BigCommerceUserScheme(
            authentication_force_password_reset=customer.get("authentication", {}).get("force_password_reset", False),
            company=customer.get("company"),
            customer_group_id=customer.get("customer_group_id", 0),
            email=customer.get("email"),
            first_name=customer.get("first_name"),
            last_name=customer.get("last_name"),
            notes=customer.get("notes"),
            phone=customer.get("phone"),
            registration_ip_address=customer.get("registration_ip_address"),
            tax_exempt_category=customer.get("tax_exempt_category"),
            date_modified=datetime.now(),
            accepts_product_review_abandoned_cart_emails=customer.get("accepts_product_review_abandoned_cart_emails", False),
            origin_channel_id=customer.get("origin_channel_id"),
            channel_ids=customer.get("channel_ids")
        )
