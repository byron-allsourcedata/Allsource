from fastapi import HTTPException
from httpx import Client
from schemas.integrations.shopify import ShopifyCustomer 
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from datetime import datetime
from schemas.integrations.integrations import IntegrationCredentials
from typing import List


class ShopifyIntegrationService:

    def __init__(self, integration_persistence: IntegrationsPresistence, client: Client):
        self.integration_persistence = integration_persistence
        self.client = client

    
    def __get_credentials(self, user_id: int):
        return self.integration_persistence.get_credentials_for_service(user_id, 'Shopify')

    def __set_pixel(self, user, shop_domain: str, access_token: str):
        script_url = f'https://maximiz-data.s3.us-east-2.amazonaws.com/pixel_installed_shopify.js?client_id={user['data_provider_id']}'
        response = self.client.post(f'https://{shop_domain}.myshopify.com/admin/api/2024-07/script_tags.json',
                         headers={'X-Shopify-Access-Token': access_token, "Content-Type": "application/json"}, 
                         json={"script_tag":{"event": "onload","src":f"{script_url}"}})
        if response.status_code != 201: 
            raise HTTPException(status_code=response.status_code, detail={'status': 'error', 'detail': {
                'message': 'Set Shopify pixel failed'
            }})
        return {'message': 'Successfuly'}

    def __get_customers(self, shop_domain: str, access_token: str):
        response = self.client.get(f'https://{shop_domain}.myshopify.com/admin/api/2023-07/customers.json', headers={'X-Shopify-Access-Token': access_token})
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail={'status': 'error', 'detail': {'message': 'Shopify credentials invalid'}})
        return response.json().get('customers')




    def __save_integration(self, shop_domain: str, access_token: str, user_id: int):
        credentials = {'user_id': user_id, 'shop_domain': shop_domain,
                       'access_token': access_token, 'service_name': 'Shopify'}
        if self.integration_persistence.get_credentials_for_service(user_id, 'Shopify'):
            raise HTTPException(status_code=409, detail={'status': 'error', 'detail': {
                'message': 'You already have Shopify integrations'
            }})    
        integrations = self.integration_persistence.create_integration(credentials)
        if not integrations:
            raise HTTPException(status_code=409, detail={'status': 'error', 'detail': {
                'message': 'Save integrations is failed'
            }})
        return integrations
    

    def __save_customer(self, customer: ShopifyCustomer, user_id: int):
        with self.integration_persistence as service:
            service.shopify.save_customer(customer.model_dump(), user_id)


    def add_integration(self, user, credentials: IntegrationCredentials):
        if user['company_website'] != f'https://{credentials.shopify.shop_domain}.myshopify.com':
            raise HTTPException(status_code=400, detail={'status': 'error', 'detail': {'message': 'Store Domain does not match the one you specified earlier'}})
        customers = [self.__mapped_customer(customer) for customer in self.__get_customers(credentials.shopify.shop_domain, credentials.shopify.access_token)]
        self.__set_pixel(user, credentials.shopify.shop_domain, credentials.shopify.access_token)
        integrataion = self.__save_integration(credentials.shopify.shop_domain, credentials.shopify.access_token, user['id'])
        for customer in customers:
            self.__save_customer(customer, user['id'])
        return {
            'status': 'Successfuly',
            'detail': {
                'id': integrataion.id,
                'service_name': 'Shopify'
            }
        }        

    def __create_or_upadte_shopify_customer(self, customer, shop_domain: str, access_token: str):
        customer_json = self.__mapped_customer_for_shopify(customer)
        response = self.client.post(f'https://{shop_domain}.myshopify.com/admin/api/2024-07/customers.json', 
                                    headers={'X-Shopify-Token': access_token, 
                                             "Content-Type": "application/json"}, 
                                    data=customer_json)
        if response.status_code != 201:
            raise HTTPException(status_code=response.status_code)
        return response.json().get('customers')

    def export_sync(self, user, list_name: str, list_id: str = None, customers_ids: List[int] = None, filter_id: int = None):
        credential = self.__get_credentials(user['id'])
        if not list_id:
            list_id = self.__create_list(list_name)
        if not customers_ids:
            if not filter_id:
                raise HTTPException(status_code=400, detail={'status': 'error', 'detail': {'message': 'Filter is empty' } } )
            custoemrs_ids = self.leads_persistence.get_customer_by_filter_id(user['id'], filter_id)
        customers_klaviyo_ids = self.__get_customers_klaiyo_ids(customers_ids, user['id'])
        klaviyo_ids = [self.__create_or_update_klaviyo_cutomer(customer, customer_klaviyo_id) for (customer, customer_klaviyo_id) in zip([self.leads_persistence.get_lead_data(customer_id) for customer_id in customers_klaviyo_ids], customers_klaviyo_ids)]

        for klaviyo_id in klaviyo_ids:
            self.__add_customer_to_list(list_id, klaviyo_id, credential.access_token)
        return {
            'status': 'Success'
        }
    
    def sync_import(self, user_id: int):
        credentials = self.__get_credentials(user_id)
        self.__save_customer([self.__mapped_customer(customer) 
                              for customer in self.__get_customers(credentials.shopify.shop_domain, 
                                                                   credentials.shopify.access_token)], 
                              user_id)

# -------------------------------MAPPED-SHOPIFY-DATA------------------------------------ #

    def __mapped_customer(self, customer) -> ShopifyCustomer:
        sms_marketing_consent = customer.get("sms_marketing_consent") or {}
        email_marketing_consent = customer.get("email_marketing_consent") or {}
        return ShopifyCustomer(
            shopify_user_id=customer.get("id"),
            email=customer.get("email"),
            updated_at=datetime.now(),
            first_name=customer.get("first_name"),
            last_name=customer.get("last_name"),
            orders_count=customer.get("orders_count", 0),
            state=customer.get("state"),
            total_spent=customer.get("total_spent", '0.00'),
            last_order_id=customer.get("last_order_id"),
            note=customer.get("note"),
            verified_email=customer.get("verified_email", False),
            multipass_identifier=customer.get("multipass_identifier"),
            tax_exempt=customer.get("tax_exempt", False),
            tags=customer.get("tags"),
            last_order_name=customer.get("last_order_name"),
            currency=customer.get("currency", 'GBP'),
            phone=customer.get("phone"),
            accepts_marketing=customer.get("accepts_marketing", False),
            accepts_marketing_updated_at=customer.get("accepts_marketing_updated_at"),
            marketing_opt_in_level=customer.get("marketing_opt_in_level"),
            email_marketing_consent_state=email_marketing_consent.get("state"),
            email_marketing_consent_opt_in_level=email_marketing_consent.get("opt_in_level"),
            sms_marketing_consent_state=sms_marketing_consent.get("state"),
            admin_graphql_api_id=customer.get("admin_graphql_api_id"),
            address_id=customer.get("address_id"),
            address_first_name=customer.get("address_first_name"),
            address_last_name=customer.get("address_last_name"),
            address_company=customer.get("address_company"),
            address1=customer.get("address1"),
            address2=customer.get("address2"),
            address_city=customer.get("address_city"),
            address_province=customer.get("address_province"),
            address_country=customer.get("address_country"),
            address_zip=customer.get("address_zip"),
            address_phone=customer.get("address_phone"),
            address_name=customer.get("address_name"),
            address_province_code=customer.get("address_province_code"),
            address_country_code=customer.get("address_country_code"),
            address_country_name=customer.get("address_country_name"),
            address_default=customer.get("address_default", False)
        )
    
    def __mapped_customer_for_shopify(self, customer):
        return {
             "first_name": customer.first_name,
            "last_name": customer.last_name,
            "email": customer.business_email,
            "phone": customer.mobile_phone,
            "addresses": [{
                "address1": customer.company_address,
                "city": customer.company_city,
                "province": customer.company_state,
                "zip": customer.company_zip,
                "phone": customer.mobile_phone,
                "last_name": customer.last_name,
                "first_name": customer.first_name,
                "country": "CA"
            }]}