from fastapi import HTTPException
from httpx import Client
from schemas.integrations.shopify import ShopifyUserScheme 
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from typing import List, Any
from datetime import datetime
import logging
from .utils import IntegrationsABC


class ShopifyIntegrationService(IntegrationsABC):

    def __init__(self, user_integration_persistence: IntegrationsPresistence, client: Client, user):
        self.user_integration_persistence = user_integration_persistence
        self.client = client
        self.user = user


    def __mapped_leads(self, leads: List[Any]) -> List[ShopifyUserScheme]:
        shopify_users = []
        for lead in leads:
            sms_marketing_consent = lead.get("sms_marketing_consent") or {}
            email_marketing_consent = lead.get("email_marketing_consent") or {}
            shopify_users.append(ShopifyUserScheme(
                shopify_user_id=lead.get("id"),
                email=lead.get("email"),
                updated_at=datetime.now(),
                first_name=lead.get("first_name"),
                last_name=lead.get("last_name"),
                orders_count=lead.get("orders_count", 0),
                state=lead.get("state"),
                total_spent=lead.get("total_spent", '0.00'),
                last_order_id=lead.get("last_order_id"),
                note=lead.get("note"),
                verified_email=lead.get("verified_email", False),
                multipass_identifier=lead.get("multipass_identifier"),
                tax_exempt=lead.get("tax_exempt", False),
                tags=lead.get("tags"),
                last_order_name=lead.get("last_order_name"),
                currency=lead.get("currency", 'GBP'),
                phone=lead.get("phone"),
                accepts_marketing=lead.get("accepts_marketing", False),
                accepts_marketing_updated_at=lead.get("accepts_marketing_updated_at"),
                marketing_opt_in_level=lead.get("marketing_opt_in_level"),
                email_marketing_consent_state=email_marketing_consent.get("state"),
                email_marketing_consent_opt_in_level=email_marketing_consent.get("opt_in_level"),
                sms_marketing_consent_state=sms_marketing_consent.get("state"),
                admin_graphql_api_id=lead.get("admin_graphql_api_id"),
                address_id=lead.get("address_id"),
                address_first_name=lead.get("address_first_name"),
                address_last_name=lead.get("address_last_name"),
                address_company=lead.get("address_company"),
                address1=lead.get("address1"),
                address2=lead.get("address2"),
                address_city=lead.get("address_city"),
                address_province=lead.get("address_province"),
                address_country=lead.get("address_country"),
                address_zip=lead.get("address_zip"),
                address_phone=lead.get("address_phone"),
                address_name=lead.get("address_name"),
                address_province_code=lead.get("address_province_code"),
                address_country_code=lead.get("address_country_code"),
                address_country_name=lead.get("address_country_name"),
                address_default=lead.get("address_default", False)
            ))
        return shopify_users




    def get_leads(self, shop_domain: str, access_token: str):
        logging.info(f'Get leads from Shopify <- email: {self.user['email']}, shop_domain: {shop_domain}, X-Shopify-Access-Token: {access_token}')
        response = self.client.get(f'https://{shop_domain}.myshopify.com/admin/api/2023-07/customers.json', headers={'X-Shopify-Access-Token': access_token})
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail='Shopify credentials invalid')
        return response.json().get('customers')


    def __save_integrations(self, shop_domain: str, access_token: str):
        credentials = {'user_id': self.user['id'], 'shop_domain': shop_domain, 'access_token': access_token, 'service_name': 'shopify' }
        integration = self.user_integration_persistence.get_user_integrations_by_service(self.user['id'], 'shopify')
        if not integration:
            logging.info(f'{self.user['email']} create integration Shopify')
            integration = self.user_integration_persistence.create_integration(credentials)
            return integration
        logging.info(f'{self.user['email']} update integration Shopify')
        self.user_integration_persistence.edit_integrations(integration.id, credentials)
        return 


    def __save_leads(self, leads: List[ShopifyUserScheme]):
        for lead in leads:
            with self.user_integration_persistence as persistence:
                persistence.shopify.save_leads(lead.model_dump(), self.user['id'])


    def create_integration(self, shop_domain: str, access_token: str):
        leads = self.get_leads(shop_domain, access_token)
        self.__save_integrations(shop_domain, access_token)
        self.__save_leads(self.__mapped_leads(leads))
        return
