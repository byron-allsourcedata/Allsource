import hashlib
import os
from models.users_domains import UserDomains
from schemas.integrations.shopify import ShopifyCustomer, ShopifyOrderAPI
from schemas.integrations.integrations import IntegrationCredentials
from persistence.leads_persistence import LeadsPersistence
from persistence.leads_order_persistence import LeadOrdersPersistence
from persistence.integrations.user_sync import IntegrationsUserSyncPersistence
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from httpx import Client
from fastapi import HTTPException
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
        date = datetime.now() - timedelta(hours=24)
        url = f'{shop_domain}/admin/api/2024-07/orders.json'
        params = {
            'status': 'closed',
            'fields': 'created_at,id,name,total_price,customer',
            'created_at_min': date.isoformat()
        }
        
        headers = {
            'X-Shopify-Access-Token': access_token,
            "Content-Type": "application/json"
        }

        response = self.__handle_request('GET', url, headers=headers, params=params)
        return response.json().get('orders')


    def get_credentials(self, domain_id: int):
        return self.integration_persistence.get_credentials_for_service(domain_id, 'Shopify')


    def __set_pixel(self, user, domain, shop_domain: str, access_token: str):
        client_id = domain.data_provider_id
        if client_id is None:
            client_id = hashlib.sha256((str(domain.id) + os.getenv('SECRET_SALT')).encode()).hexdigest()
            self.db.query(UserDomains).filter(UserDomains.user_id == user.get('id'), UserDomains.domain == domain.domain).update(
                {UserDomains.data_provider_id: client_id},
                synchronize_session=False
            )
            self.db.commit() 
        script_shopify = f"""
window.pixelClientId = '{client_id}';

let addedToCartHandler;
let viewedProductHandler;

(function() {{
    let cartEventCalled = false;
    let productViewedEventCalled = false;
    let productData = null;
    const productUrl = location.protocol + '//' + location.host + location.pathname.replace(/\/$/, '');

    if (productUrl.includes("/products/")) {{
        fetch(productUrl + '.js')
            .then(res => res.json())
            .then(data => {{
                productData = data;
            }});
    }}

    function getProductData(item) {{
        let itemAdded = null;
        const defaultImageUrl = getImageUrl();

        if (item) {{
            if (item.items && Array.isArray(item.items)) {{
                item = item.items[0];
            }}
            productData = item;
        }}

        if (productData) {{
            itemAdded = {{
                name: productData.title,
                product_id: productData.id,
                product_url: productUrl,
                price: productData.price,
                image_url: getImageUrl() || defaultImageUrl,
                currency: window.Shopify?.currency?.active
            }};

            if (productData.variant_id) {{
                itemAdded.product_id = productData.product_id || itemAdded.product_id;
                itemAdded.VariantID = productData.variant_id;
                itemAdded.Variant = productData.title || productData.variant_title;
            }} else {{
                const variantId = new URLSearchParams(window.location.search).get('variant');
                if (variantId) {{
                    const variant = productData.variants?.find(v => v.id.toString() === variantId);
                    if (variant) {{
                        itemAdded.price = variant.price;
                        itemAdded.VariantID = variant.id;
                        itemAdded.Variant = variant.name;
                    }}
                }}
            }}
        }}

        return itemAdded;
    }}

    function getImageUrl() {{
        if (productData) {{
            if (typeof productData.featured_image === 'string') {{
                return productData.featured_image;
            }} else if (typeof productData.featured_image === 'object') {{
                return productData.featured_image.url;
            }}
            const variantId = new URLSearchParams(window.location.search).get('variant');
            if (variantId) {{
                const variant = productData.variants?.find(v => v.id.toString() === variantId);
                return variant?.featured_image?.src || null;
            }}
        }}
        return null;
    }}

    addedToCartHandler = function(item) {{
        if (!cartEventCalled && productData) {{
            const itemAdded = getProductData(item);
            if (itemAdded && typeof addToCart === 'function') {{
                addToCart(itemAdded);
                cartEventCalled = true;
            }}
        }}
    }};

    viewedProductHandler = function() {{
        if (productData && !productViewedEventCalled) {{
            const itemAdded = getProductData();
            if (itemAdded && typeof viewedProduct === 'function') {{
                viewedProduct(itemAdded);
                productViewedEventCalled = true;
            }}
        }}
    }};

    setTimeout(viewedProductHandler, 6000);
}})();

(function(ns, fetch) {{
    ns.fetch = function() {{
        const response = fetch.apply(this, arguments);
        response.then(async (res) => {{
            const clonedResponse = res.clone();
            if (clonedResponse.ok && clonedResponse.url && (window.location.origin + '/cart/add.js').includes(clonedResponse.url)) {{
                if (!location.pathname.includes("/cart")) {{
                    try {{
                        const data = await clonedResponse.json();
                        if (data) {{
                            addedToCartHandler(data);
                        }}
                    }} catch (error) {{}}
                }}
            }}
        }});

        return response;
    }};
}}(window, window.fetch));

!function () {{
    function trackCheckout() {{
        if (typeof Shopify === 'undefined') {{
            return;
        }}

        if (typeof Shopify.checkout === 'undefined') {{
            return;
        }}

        var event = Shopify.checkout;
        var totalPrice = event.total_price;
        if (typeof totalPrice !== 'undefined') {{
            if (!totalPrice.toString().includes('.')) {{
                totalPrice = (totalPrice / 100).toFixed(2);
            }}
        }} else {{
            return;
        }}

        var order_data = {{
            order_id: event.order_id,
            total_price: totalPrice,
            currency: event.currency,
            created_at_shopify: event.created_at    
        }};

        if (typeof checkoutCompleted === 'function') {{
            checkoutCompleted(order_data);
        }}
    }}

    function checkForCheckout() {{
        if (typeof Shopify !== 'undefined' && typeof Shopify.checkout !== 'undefined') {{
            clearInterval(checkInterval);
            trackCheckout();
        }}
    }}

    var checkInterval = setInterval(checkForCheckout, 1000);
    setTimeout(function() {{
        clearInterval(checkInterval);
    }}, 30000);
}}();
        """
        self.AWS.upload_string(script_shopify, f'shopify-pixel-code/{client_id}.js')
        script_event_url = f'https://maximiz-data.s3.us-east-2.amazonaws.com/shopify-pixel-code/{client_id}.js'
        script_pixel_url = f'https://maximiz-data.s3.us-east-2.amazonaws.com/pixel.js'
        url = f'{shop_domain}/admin/api/2024-07/script_tags.json'

        headers = {
            'X-Shopify-Access-Token': access_token,
            "Content-Type": "application/json"
        }
        scrips_list = self.__handle_request("GET", url, headers=headers)
        for script in scrips_list.json().get('script_tags'):
            if script.get('src') in script_pixel_url or 'shopify-pixel-code' in script.get('src'):
                self.__handle_request('DELETE', f"{shop_domain}/admin/api/2024-07/script_tags/{script.get('id')}.json", headers=headers)

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


    def __save_integration(self, shop_domain: str, access_token: str, domain_id: int):
        credentials = {
            'domain_id': domain_id, 
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


    def add_integration(self, user, domain, credentials: IntegrationCredentials):
        if not credentials.shopify.shop_domain.startswith('https://'):
            credentials.shopify.shop_domain = f'https://{credentials.shopify.shop_domain}'
        shop_domain = credentials.shopify.shop_domain.lower().lstrip('http://').lstrip('https://')
        user_website = domain.domain.lower().lstrip('http://').lstrip('https://')
        if user_website != shop_domain:
            raise HTTPException(status_code=400, detail={'status': 'error', 'detail': {'message': 'Store Domain does not match the one you specified earlier'}})
        self.__save_integration(credentials.shopify.shop_domain, credentials.shopify.access_token, domain.id)
        if not domain.is_pixel_installed:
            self.__set_pixel(user, domain, credentials.shopify.shop_domain, credentials.shopify.access_token)
        return {
            'status': 'Successfully',
            'detail': {
                'service_name': 'Shopify'
            }
        }
    
    def order_sync(self, domain_id):
        credential = self.get_credentials(domain_id)
        orders = [self.__mapped_customer_shopify_order(order) for order in self.__get_orders(credential.shop_domain, credential.access_token) if order]
        for order in orders:
            try:
                lead_user = self.lead_persistence.get_leads_user_filter_by_email(domain_id, order.email)
                if lead_user and len(lead_user) > 0: 
                    self.lead_orders_persistence.create_lead_order({
                        'platform': 'Shopify',
                        'platform_user_id': order.shopify_user_id,
                        'platform_order_id': order.order_shopify_id,
                        'lead_user_id': lead_user[0].id,
                        'platform_created_at': order.created_at_shopify,
                        'total_price': order.total_price,
                        'currency_code': order.currency_code,
                        'platfrom_email': order.email
                    })
            except: pass

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