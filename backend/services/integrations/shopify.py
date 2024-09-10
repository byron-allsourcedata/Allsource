from typing import List
from schemas.integrations.shopify import ShopifyCustomer, ShopifyOrderAPI
from schemas.integrations.integrations import IntegrationCredentials
from persistence.leads_persistence import LeadsPersistence
from persistence.leads_order_persistence import LeadOrdersPersistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from persistence.user_persistence import UserPersistence
from models.integrations.users_integrations import UserIntegration
from httpx import Client
from fastapi import HTTPException
from datetime import datetime


class ShopifyIntegrationService:

    def __init__(self, integration_persistence: IntegrationsPresistence, 
                 lead_persistence: LeadsPersistence, lead_orders_persistence: LeadOrdersPersistence,
                 integrations_user_sync_persistence: IntegrationsUserSyncPersistence,
                 client: Client):
        self.integration_persistence = integration_persistence
        self.lead_persistence = lead_persistence
        self.lead_orders_persistence = lead_orders_persistence
        self.integrations_user_sync_persistence = integrations_user_sync_persistence
        self.client = client


    def __handle_request(self, method: str, url: str, headers: dict = None, json: dict = None, data: dict = None, params: dict = None):
        response = self.client.request(method, url, headers=headers, json=json, data=data, params=params)

        if response.is_redirect:
            redirect_url = response.headers.get('Location')
            if redirect_url:
                response = self.client.request(method, redirect_url, headers=headers, json=json, data=data, params=params)

        if response.status_code not in {200, 201}:
            raise HTTPException(status_code=response.status_code, detail={'status': 'error'})
        
        return response


    def __get_orders(self, shop_domain: str, access_token: str):
        url = f'{shop_domain}/admin/api/2024-07/orders.json?fields=created_at,id,name,total-price,total_price_set,customer&status=closed'
        params = {
            'status': 'closed',
            'fields': 'created_at,id,name,total_price'
        }
        
        headers = {
            'X-Shopify-Access-Token': access_token,
            "Content-Type": "application/json"
        }

        response = self.__handle_request('GET', url, headers=headers, params=params)

        return response.json().get('orders')


    def __get_credentials(self, user_id: int):
        return self.integration_persistence.get_credentials_for_service(user_id, 'shopify')


    def __set_pixel(self, user, shop_domain: str, access_token: str):
        script_event_url = f'https://maximiz-data.s3.us-east-2.amazonaws.com/pixel_shopify.js?client_id={user["data_provider_id"]}'
        script_pixel_url = f'https://maximiz-data.s3.us-east-2.amazonaws.com/pixel.js'
        url = f'{shop_domain}/admin/api/2024-07/script_tags.json'
        
        headers = {
            'X-Shopify-Access-Token': access_token,
            "Content-Type": "application/json"
        }

        script_event_data = {
            "script_tag": {
                "event": "onload",
                "src": script_event_url
            }
        }
        script_pixel_data = {
            "script_tag": {
                "event": "onload",
                "src": script_pixel_url
            }
        }
        self.__handle_request('POST', url, headers=headers, json=script_event_data)
        self.__handle_request('POST', url, headers=headers, json=script_pixel_data)
        return {'message': 'Successfully'}


    def __get_customers(self, shop_domain: str, access_token: str):
        url = f'{shop_domain}/admin/api/2023-07/customers.json'
        headers = {'X-Shopify-Access-Token': access_token}

        response = self.__handle_request('GET', url, headers=headers)
        return response.json().get('customers')


    def __save_integration(self, shop_domain: str, access_token: str, user_id: int):
        if self.integration_persistence.get_credentials_for_service(user_id, 'Shopify'):
            raise HTTPException(status_code=409, detail={'status': 'error', 'detail': {'message': 'You already have Shopify integrations'}})

        credentials = {
            'user_id': user_id, 
            'shop_domain': shop_domain,
            'access_token': access_token, 
            'service_name': 'Shopify'
        }

        integration = self.integration_persistence.create_integration(credentials)
        if not integration:
            raise HTTPException(status_code=409, detail={'status': 'error', 'detail': {'message': 'Save integration failed'}})

        return integration


    def __save_customer(self, customer: ShopifyCustomer, user_id: int):
        with self.integration_persistence as service:
            service.shopify.save_customer(customer.model_dump(), user_id)


    def __create_or_update_shopify_customer(self, customer, shop_domain: str, access_token: str):
        customer_json = self.__mapped_customer_for_shopify(customer)
        url = f'{shop_domain}/admin/api/2024-07/customers.json'

        headers = {
            'X-Shopify-Token': access_token,
            "Content-Type": "application/json"
        }

        response = self.__handle_request('POST', url, headers=headers, json=customer_json)
        return response.json().get('customers')


    def add_integration(self, user, credentials: IntegrationCredentials):
        if user['company_website'] != f'{credentials.shopify.shop_domain}':
            raise HTTPException(status_code=400, detail={'status': 'error', 'detail': {'message': 'Store Domain does not match the one you specified earlier'}})

        customers = [self.__mapped_customer(customer) for customer in self.__get_customers(credentials.shopify.shop_domain, credentials.shopify.access_token)]
        integration = self.__save_integration(credentials.shopify.shop_domain, credentials.shopify.access_token, user['id'])
        self.__set_pixel(user, credentials.shopify.shop_domain, credentials.shopify.access_token)
        
        for customer in customers:
            self.__save_customer(customer, user['id'])

        return {
            'status': 'Successfully',
            'detail': {
                'id': integration.id,
                'service_name': 'Shopify'
            }
        }
    
    def __order_sync(self, user_id):
        credential = self.__get_credentials(user_id)
        orders = [self.__mapped_customer_shopify_order(order) for order in self.__get_orders(credential.shop_domain, credential.access_token)]
        for order in orders:
            lead_user = self.lead_persistence.get_leads_user_filter_by_email(user_id, order.email)
            if lead_user and len(lead_user) > 0: 
                self.lead_orders_persistence.create_lead_order({
                    'shopify_user_id': order.shopify_user_id,
                    'lead_user_id': lead_user[0].id,
                    'shopify_order_id': order.order_shopify_id,
                    'currency_code': order.currency_code,
                    'total_price': order.total_price,
                    'created_at_shopify': order.created_at_shopify
                })


    def create_sync(self, user_id: int, 
                    integration_id: int, 
                    sync_type: str,  
                    supression: bool, 
                    filter_by_contact_type: str):
        data = {
            'user_id': user_id,
            'integration_id': integration_id,
            'sync_type': sync_type,
            'supression': supression,
            'filter_by_contact_type': filter_by_contact_type
        }

        sync = self.integrations_user_sync_persistence.create_sync(data)
        return {'status': 'Successfuly', 'detail': sync}
    

    def __export_sync(self, user_id: int):
        credential = self.__get_credentials(user_id)
        syncs = self.integrations_user_sync_persistence.get_filter_by(user_id=user_id)
        for sync in syncs:
            leads_list = self.lead_persistence.get_leads_user(user_id=sync.user_id, status=sync.filter_by_contact_type)
            for lead in leads_list:
                self.__create_or_update_shopify_customer(self.lead_persistence.get_lead_data(lead.five_x_five_user_id), 
                                                         credential.shop_domain, credential.access_token)
            self.integrations_user_sync_persistence.update_sync({
                'last_sync_date': datetime.now()
            }, id=sync.id)
        return {'status': 'Success'}



    def __import_sync(self, user_id: int):
        credentials = self.__get_credentials(user_id)
        customers = [self.__mapped_customer(customer) 
                     for customer in self.__get_customers(credentials.shopify.shop_domain, 
                                                          credentials.shopify.access_token)]
        self.__save_customer(customers, user_id)


    def sync(self, user_id):
        self.__import_sync(user_id)
        self.__order_sync(user_id)
        self.__export_sync(user_id)

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
            }]}
    
    def __mapped_customer_shopify_order(self, order) -> ShopifyOrderAPI:
        return ShopifyOrderAPI(
            order_shopify_id=order.get('id'),
            shopify_user_id=order.get('customer').get('id'),
            total_price=float(order.get('total_price')),
            currency_code=order.get('total_price_set').get('shop_money').get('currency_code'),
            created_at_shopify=order.get('created_at'),
            email=order.get('customer').get('email')
        )