import hashlib
import os
import binascii
import httpx
from enums import IntegrationsStatus, OauthShopify
from config.shopify import ShopifyConfig
from fastapi import HTTPException, status
from models.users_domains import UserDomains
from models.users import User
from models.plans import SubscriptionPlan
from ..jwt_service import create_access_token
from schemas.integrations.shopify import ShopifyCustomer, ShopifyOrderAPI
from schemas.integrations.integrations import IntegrationCredentials
from persistence.leads_persistence import LeadsPersistence
from persistence.leads_order_persistence import LeadOrdersPersistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from httpx import Client
from schemas.users import ShopifyPayloadModel
import shopify
from enums import SourcePlatformEnum
from datetime import datetime, timedelta
from services.aws import AWSService
from sqlalchemy.orm import Session


class ShopifyIntegrationService:

    def __init__(self, integration_persistence: IntegrationsPresistence, 
                 lead_persistence: LeadsPersistence, lead_orders_persistence: LeadOrdersPersistence,
                 integrations_user_sync_persistence: IntegrationsUserSyncPersistence,
                 client: Client, aws_service: AWSService, db: Session):
        self.integration_persistence = integration_persistence
        self.lead_persistence = lead_persistence
        self.lead_orders_persistence = lead_orders_persistence
        self.integrations_user_sync_persistence = integrations_user_sync_persistence
        self.client = client
        self.AWS = aws_service
        self.db = db
        
    def get_shopify_token(self, shopify_data: ShopifyPayloadModel):
        shopify.Session.setup(api_key=ShopifyConfig.key, secret=ShopifyConfig.secret)
        session = shopify.Session(shopify_data.shop, ShopifyConfig.api_version)
        access_token = session.request_token(params=shopify_data.model_dump())
        return access_token
    
    def get_shopify_shop_id(self, shopify_data: ShopifyPayloadModel, shopify_access_token: str):
        shop_id = None
        with shopify.Session.temp(shopify_data.shop, ShopifyConfig.api_version, shopify_access_token):
            shop = shopify.Shop.current()
            shop_id = shop.id
        return shop_id
    
    def create_new_recurring_charge(self, shopify_domain: str, shopify_access_token: str, plan: SubscriptionPlan, test_mode: bool) -> str:
        with shopify.Session.temp(shopify_domain, ShopifyConfig.api_version, shopify_access_token):
            plan_interval = "EVERY_30_DAYS" if plan.interval == "month" else "ANNUAL"
            new_charge = shopify.RecurringApplicationCharge.create({
                "name": plan.title,
                "return_url": os.getenv("STRIPE_SUCCESS_URL"),
                "price": float(plan.price),
                "currency_code": plan.currency.upper(),
                "interval": plan_interval,
                "test": test_mode
            })
        
        if new_charge is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={'status': 'Failed to create new charge'})
        
        link = new_charge.attributes.get("confirmation_url")
        return {"link": link}
    
    def initialize_subscription_charge(self, plan: SubscriptionPlan, user: dict):
        test_mode = True if os.getenv("MODE") == "dev" else False
        return self.create_new_recurring_charge(shopify_domain=user.get('shop_domain'), shopify_access_token=user.get('shopify_token'), plan=plan, test_mode=test_mode)
    
    def cancel_current_subscription(self, user: User):
        with shopify.Session.temp(user.shop_domain, ShopifyConfig.api_version, user.shopify_token):
            charge = shopify.RecurringApplicationCharge.current()
            if charge is None:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail={'status': 'No shopify plan active'})
            charge.destroy()
        return True
    
    def update_downgrade_subscription(user, new_plan):
        pass
            
    def create_webhooks_for_store(self, shopify_data: ShopifyPayloadModel, shopify_access_token):        
        with shopify.Session.temp(shopify_data.shop, ShopifyConfig.api_version, shopify_access_token):
            shopify.Webhook.create({
                "topic": "app_subscriptions/update",
                "address": os.getenv("SITE_HOST_URL") + "/api/subscriptions/shopify/billing/webhook",
                "format": "json"
            })
            shopify.Webhook.create({
                "topic": "app/uninstalled",
                "address": os.getenv("SITE_HOST_URL") + "/api/integrations/shopify/uninstall",
                "format": "json"
            })


    def __handle_request(self, method: str, url: str, headers: dict = None, json: dict = None, data: dict = None, params: dict = None):
        if self.client.is_closed:
            self.client = httpx.Client()

        response = self.client.request(method, url, headers=headers, json=json, data=data, params=params)

        if response.is_redirect:
            redirect_url = response.headers.get('Location')
            if redirect_url:
                response = self.client.request(method, redirect_url, headers=headers, json=json, data=data, params=params)

        if response.status_code not in {200, 201}:
            raise HTTPException(status_code=response.status_code, detail={'status': 'error'})
        
        return response


    def __get_orders(self, credential):
        date = datetime.now() - timedelta(hours=24)
        url = f'{credential.shop_domain}/admin/api/2024-07/orders.json'
        params = {
            'status': 'closed',
            'fields': 'created_at,id,name,total_price,customer',
            'created_at_min': date.isoformat()
        }
        
        headers = {
            'X-Shopify-Access-Token': credential.access_token,
            "Content-Type": "application/json"
        }
         
        response = self.__handle_request('GET', url, headers=headers, params=params)
        if response.status_code == 401:
            credential.error_message = 'Invalid Access Token'
            credential.is_failde = True
            self.integration_persistence.db.commit()
        return response.json().get('orders')


    def get_credentials(self, domain_id: int):
        return self.integration_persistence.get_credentials_for_service(domain_id, SourcePlatformEnum.SHOPIFY.value)


    def __set_pixel(self, user_id, domain, credentials):
        client_id = domain.data_provider_id
        if client_id is None:
            client_id = hashlib.sha256((str(domain.id) + os.getenv('SECRET_SALT')).encode()).hexdigest()
            self.db.query(UserDomains).filter(UserDomains.user_id == user_id, UserDomains.domain == domain.domain).update(
                {UserDomains.data_provider_id: client_id},
                synchronize_session=False
            )
            self.db.commit()
        with open('../backend/data/js_pixels/shopify.js', 'r') as file:
            existing_script_code = file.read()

        script_shopify = f"window.pixelClientId = '{client_id}';\n" + existing_script_code
        self.AWS.upload_string(script_shopify, f'shopify-pixel-code/{client_id}.js')
        script_event_url = f'https://maximiz-data.s3.us-east-2.amazonaws.com/shopify-pixel-code/{client_id}.js'
        url = f'{credentials.shopify.shop_domain}/admin/api/2024-07/script_tags.json'

        headers = {
            'X-Shopify-Access-Token': credentials.shopify.access_token,
            "Content-Type": "application/json"
        }
        scrips_list = self.__handle_request("GET", url, headers=headers)
        if scrips_list.status_code == 401:
            credentials.shopify.error_message = 'Invalid Access Token'
            self.integration_persistence.db.commit()
            raise HTTPException(status_code=403, detail={'status': IntegrationsStatus.CREDENTAILS_INVALID.value})
        for script in scrips_list.json().get('script_tags'):
            if 'shopify-pixel-code' in script.get('src'):
                self.__handle_request('DELETE', f"{credentials.shopify.shop_domain}/admin/api/2024-07/script_tags/{script.get('id')}.json", headers=headers)
        script_event_data = {
            "script_tag": {
                "event": "onload",
                "src": script_event_url
            }
        }
        self.__handle_request('POST', url, headers=headers, json=script_event_data)
        return {'message': 'Successfully'}


    def __get_customers(self, shop_domain: str, access_token: str):
        url = f'{shop_domain}/admin/api/2023-07/customers.json'
        headers = {'X-Shopify-Access-Token': access_token}

        response = self.__handle_request('GET', url, headers=headers)
        return response.json().get('customers')
    
    def get_shopify_install_url(self, shop, r):
        shopify.Session.setup(api_key=ShopifyConfig.key, secret=ShopifyConfig.secret)
        shopify.Session.validate_params(params=r.query_params)
        session = shopify.Session(shop, ShopifyConfig.api_version)
        state = binascii.b2a_hex(os.urandom(15)).decode("utf-8")
        url = session.create_permission_url(ShopifyConfig.scopes, ShopifyConfig.callback_uri, state)
        return url
    
    def handle_uninstalled_app(self, payload):
        user_integration = self.integration_persistence.get_integration_by_shop_id(shop_id=payload["id"])
        if user_integration:
            self.db.query(User).filter(User.id == user_integration.user_id).update({"payment_status": "canceled"})
            self.db.delete(user_integration)
            self.db.commit()
            
    def oauth_shopify_callback(self, shop, r):
        result = {}
        query_params = dict(r.query_params)
        user_integration = self.integration_persistence.get_integration_by_shop_url(shop_url=shop)

        if user_integration is None:
            result['message'] = OauthShopify.NO_USER_CONNECTED.value
            return result

        user = self.db.query(User).filter(User.id == user_integration.user_id).first
        shopify_pay_load_model = ShopifyPayloadModel(
            code=query_params.get('code'),
            hmac=query_params.get('hmac'),
            host=query_params.get('host'),
            shop=shop,
            state=query_params.get('state'),
            timestamp=query_params.get('timestamp')
        )
        shopify_token = self.get_shopify_token(shopify_pay_load_model)
        if shopify_token is None:
            result['message'] = OauthShopify.ERROR_SHOPIFY_TOKEN.value
            return result
        
        self.__save_integration(shop, shopify_token, user_integration.domain_id, user.id)
        
        token_info = {
                "id": user.id
            }
        token = create_access_token(token_info)
        result['token'] = token
        return result
    

    def __save_integration(self, shop_domain: str, access_token: str, domain_id: int, user_id, shop_id=None):
        credential = self.get_credentials(domain_id=domain_id)
        if credential:
            credential.access_token = access_token
            credential.shop_domain = shop_domain
            self.integration_persistence.db.commit()
            return
        credentials = {
            'domain_id': domain_id, 
            'shop_domain': shop_domain,
            'access_token': access_token, 
            'service_name': SourcePlatformEnum.SHOPIFY.value,
            'user_id': user_id
        }
        if shop_id:
            credentials['shop_id'] = shop_id

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


    def add_integration(self, credentials: IntegrationCredentials, domain, user_id, shop_id=None):
        if not credentials.shopify.shop_domain.startswith('https://'):
            credentials.shopify.shop_domain = f'https://{credentials.shopify.shop_domain}'
        shop_domain = credentials.shopify.shop_domain.lower().lstrip('http://').lstrip('https://')
        user_website = domain.domain.lower().lstrip('http://').lstrip('https://')
        if user_website != shop_domain:
            raise HTTPException(status_code=400, detail={'status': 'error', 'detail': {'message': 'Store Domain does not match the one you specified earlier'}})
        self.__save_integration(credentials.shopify.shop_domain, credentials.shopify.access_token, domain.id, user_id, shop_id)
        if not domain.is_pixel_installed:
            self.__set_pixel(user_id, domain, credentials)
        return {
            'status': 'Successfully',
            'detail': {
                'service_name': SourcePlatformEnum.SHOPIFY.value
            }
        }
    
    def order_sync(self, domain_id):
        credential = self.get_credentials(domain_id)
        orders = [self.__mapped_customer_shopify_order(order) for order in self.__get_orders(credential) if order]
        for order in orders:
            lead_user = self.lead_persistence.get_leads_user_filter_by_email(domain_id, order.email)
            if lead_user and len(lead_user) > 0: 
                self.lead_orders_persistence.create_lead_order({
                    'platform': SourcePlatformEnum.SHOPIFY.value,
                    'platform_user_id': order.shopify_user_id,
                    'platform_order_id': order.order_shopify_id,
                    'lead_user_id': lead_user[0].id,
                    'platform_created_at': order.created_at_shopify,
                    'total_price': order.total_price,
                    'currency_code': order.currency_code,
                    'platfrom_email': order.email
                })

    def create_sync(self, domain_id: int, 
                    integration_id: int, 
                    sync_type: str,  
                    supression: bool,
                    list_name: str,
                    filter_by_contact_type: str, created_by: str):
        data = {
            'domain_id': domain_id,
            'integration_id': integration_id,
            'sync_type': sync_type,
            'supression': supression,
            'list_name': list_name,
            'filter_by_contact_type': filter_by_contact_type,
            'created_by': created_by
        }

        sync = self.integrations_user_sync_persistence.create_sync(data)
        return {'status': 'Successfuly', 'detail': sync}
    

    def __export_sync(self, domain_id: int):
        credential = self.get_credentials(domain_id)
        syncs = self.integrations_user_sync_persistence.get_filter_by(domain_id=domain_id)
        for sync in syncs:
            leads_list = self.lead_persistence.get_leads_domain(domain_id=sync.domain_id, status=sync.filter_by_contact_type)
            for lead in leads_list:
                self.__create_or_update_shopify_customer(self.lead_persistence.get_lead_data(lead.five_x_five_user_id), 
                                                         credential.shop_domain, credential.access_token)
            self.integrations_user_sync_persistence.update_sync({
                'last_sync_date': datetime.now()
            }, id=sync.id)
        return {'status': 'Success'}



    def __import_sync(self, user_id: int):
        credentials = self.get_credentials(user_id)
        customers = [self.__mapped_customer(customer) 
                     for customer in self.__get_customers(credentials.shopify.shop_domain, 
                                                          credentials.shopify.access_token)]
        self.__save_customer(customers, user_id)


    

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
        try:
            return ShopifyOrderAPI(
                order_shopify_id=str(order.get('id')),
                shopify_user_id=str(order.get('customer').get('id')),
                total_price=float(order.get('total_price')),
                currency_code=order.get('customer').get('currency'),
                created_at_shopify=order.get('created_at'),
                email=order.get('customer').get('email')
        )
        except: return None