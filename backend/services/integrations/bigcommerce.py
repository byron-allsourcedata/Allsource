from fastapi import HTTPException
from httpx import Client
from schemas.integrations.bigcommerce import BigCommerceUserScheme
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from typing import List, Any
from datetime import datetime
import logging
from .utils import IntegrationsABC


class BigcommerceIntegrationService(IntegrationsABC):

    def __init__(self, integration_persistence: IntegrationsPresistence, client: Client, user):
        self.integration_persistence = integration_persistence
        self.client = client
        self.user = user

    def __mapped_leads(self, leads: List[Any]) -> List[BigCommerceUserScheme]:
        bigcommerce_users = []
        for lead in leads:
            bigcommerce_users.append(BigCommerceUserScheme(
                authentication_force_password_reset=lead.get("authentication", {}).get("force_password_reset", False),
                company=lead.get("company"),
                customer_group_id=lead.get("customer_group_id", 0),
                email=lead.get("email"),
                first_name=lead.get("first_name"),
                last_name=lead.get("last_name"),
                notes=lead.get("notes"),
                phone=lead.get("phone"),
                registration_ip_address=lead.get("registration_ip_address"),
                tax_exempt_category=lead.get("tax_exempt_category"),
                date_modified=datetime.now(),
                accepts_product_review_abandoned_cart_emails=lead.get("accepts_product_review_abandoned_cart_emails", False),
                origin_channel_id=lead.get("origin_channel_id"),
                channel_ids=lead.get("channel_ids")
            ))
        return bigcommerce_users


    def get_leads(self, shop_hash: str, access_token: str):  
        logging.info(f'Get leads from BigCommerce <- email: {self.user['email']}, shop_hash: {shop_hash}, X-Auth-Token: {access_token}')
        response = self.client.get(f'https://api.bigcommerce.com/stores/{shop_hash}/v3/customers', headers={'X-Auth-Token': access_token})
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail='Bigcommerce credentials invalid')
        return response.json().get('data')


    def __save_integrations(self, shop_hash: str, access_token: str):
        credentials = {'user_id': self.user['id'], 'shop_domain': shop_hash, 'access_token': access_token, 'service_name': 'klaviyo' }
        integration = self.integration_persistence.get_user_integrations_by_service(self.user['id'], 'klaviyo')
        if not integration:
            logging.info(f'{self.user['email']} create integration Bigcommerce')
            integration = self.integration_persistence.create_integration(credentials)
            return integration
        logging.info(f'{self.user['email']} update integration Bigcommerce')
        self.integration_persistence.edit_integrations(integration.id, credentials)
        return 
    

    def __save_leads(self, leads: List[BigCommerceUserScheme]):
        for lead in leads:
            with self.integration_persistence as persistence:
                persistence.bigcommerce.save_leads(lead.model_dump(), self.user['id'])


    def create_integration(self, shop_domain: str, access_token: str):
        leads = self.get_leads(shop_domain, access_token)
        print(leads)
        self.__save_integrations(shop_domain, access_token)
        self.__save_leads(self.__mapped_leads(leads))
        return 

    