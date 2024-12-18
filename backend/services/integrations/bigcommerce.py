import hashlib
import os
from typing import List
from sqlalchemy.orm import Session
import requests
from jose import JWTError
from models.users_domains import UserDomains
from enums import IntegrationsStatus, SourcePlatformEnum
from schemas.integrations.integrations import IntegrationCredentials, OrderAPI, ShopifyOrBigcommerceCredentials
from schemas.integrations.bigcommerce import BigCommerceInfo
from persistence.leads_persistence import LeadsPersistence
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from services.aws import AWSService
from bigcommerce.api import BigcommerceApi
from httpx import Client
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from persistence.leads_order_persistence import LeadOrdersPersistence
from persistence.integrations.external_apps_installations import ExternalAppsInstallationsPersistence

class BigcommerceIntegrationsService:

    def __init__(self, integrations_persistence: IntegrationsPresistence, 
                 leads_persistence: LeadsPersistence, 
                 leads_order_persistence: LeadOrdersPersistence,
                 aws_service: AWSService, client: Client,
                 epi_persistence: ExternalAppsInstallationsPersistence):
        self.integrations_persistence = integrations_persistence
        self.lead_persistence = leads_persistence
        self.AWS = aws_service
        self.lead_orders_persistence = leads_order_persistence
        self.client = client
        self.eai_persistence = epi_persistence

    def get_credentials(self, domain_id: int):
        integration = self.integrations_persistence.get_credentials_for_service(domain_id, 'Bigcommerce')
        return integration

    def __handle_request(self, url: str, method: str = 'GET', headers: dict = None, json: dict = None, data: dict = None, params: dict = None, access_token: str = None):
        if not headers:
            headers = {
                'X-Auth-Token': access_token,
                'accept': 'application/json', 
                'content-type': 'application/json'
            }
        url = f'https://api.bigcommerce.com/stores/{url}'
        response = self.client.request(method, url, headers=headers, json=json, data=data, params=params)
        if response.is_redirect:
            redirect_url = response.headers.get('Location')
            if redirect_url:
                response = self.client.request(method, redirect_url, headers=headers, json=json, data=data, params=params)

        return response

    def __get_store_info(self, store_hash: str, access_token: str):
        url = f'{store_hash}/v2/store'
        info = self.__handle_request(url, access_token=access_token)
        print('-------------')
        print(info)
        return self.__mapped_info(info.json())
    

    def __save_integrations(self, store_hash: str, access_token: str, domain_id, user):
        credential = self.get_credentials(domain_id)
        if credential:
            credential.access_token = access_token
            credential.shop_domain = store_hash
            self.integrations_persistence.db.commit()
            return credential
        integration = self.integrations_persistence.create_integration({
            'domain_id': domain_id,
            'shop_domain': store_hash,
            'access_token': access_token,
            'full_name': user.get('full_name'),
            'service_name': SourcePlatformEnum.BIG_COMMERCE.value
        })
        if not integration:
            raise HTTPException(status_code=409, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        return integration
    

    def add_external_apps_install(self, new_credentials: IntegrationCredentials):
        try:
            epi =self.eai_persistence.create_epi({
                'platform': 'big_commerce',
                'store_hash': new_credentials.bigcommerce.shop_domain,
                'access_token': new_credentials.bigcommerce.access_token
            })
            if not epi:
                raise HTTPException(status_code=400, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
            return epi
        except:
            raise HTTPException(status_code=400, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        
    def add_integration(self, new_credentials: IntegrationCredentials, domain, user: dict):
        eai = self.eai_persistence.get_epi_by_filter_one(platform='big_commerce', store_hash=new_credentials.bigcommerce.shop_domain)
        if not eai:
            raise HTTPException(status_code=400, detail={'status': IntegrationsStatus.CREATE_IS_FAILED.value})
        credentials = self.get_credentials(domain_id=domain.id)
        info = self.__get_store_info(store_hash=eai.store_hash, 
                                     access_token=eai.access_token)
        if not info:
            raise HTTPException(status_code=409, detail=IntegrationsStatus.NOT_MATCHED_EARLIER.value)
        if info.domain.startswith('https://'):
            info.domain = info.domain.replace('https://', '')
        if not credentials and info.domain != domain.domain:
            raise HTTPException(status_code=400, detail=IntegrationsStatus.NOT_MATCHED_EARLIER.value)
        integration = self.__save_integrations(store_hash=eai.store_hash, 
                                 access_token=eai.access_token, domain_id=domain.id, user=user)
        self.__set_pixel(user.get('id'), domain, shop_domain=integration.shop_domain, access_token=integration.access_token)
        if not integration:
            raise HTTPException(status_code=409, detail=IntegrationsStatus.CREATE_IS_FAILED.value)
        return integration
    
    def oauth_bigcommerce_load(self, signed_payload, signed_payload_jwt):
        try:
            payload = BigcommerceApi.oauth_verify_payload(signed_payload, os.getenv("BIGCOMMERCE_CLIENT_SECRET"))
            payload_jwt = BigcommerceApi.oauth_verify_payload_jwt(signed_payload_jwt, os.getenv("BIGCOMMERCE_CLIENT_SECRET"), os.getenv("BIGCOMMERCE_CLIENT_ID"))
        except JWTError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Request [JWT]")
        if not payload or not payload_jwt:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Request [NON]")
        
        return {"status": "OK"}
    
    def oauth_bigcommerce_uninstall(self, signed_payload, signed_payload_jwt):
        try:
            payload = BigcommerceApi.oauth_verify_payload(signed_payload, os.getenv("BIGCOMMERCE_CLIENT_SECRET"))
            payload_jwt = BigcommerceApi.oauth_verify_payload_jwt(signed_payload_jwt, os.getenv("BIGCOMMERCE_CLIENT_SECRET"), os.getenv("BIGCOMMERCE_CLIENT_ID"))
        except JWTError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Request [JWT]")
        if not payload or not payload_jwt:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Request [NON]")
        
        user_integration = self.integrations_persistence.get_integration_by_shop_url(shop_id=payload.get("store_hash"))
        if user_integration:
            self.db.delete(user_integration)
            self.db.commit()
            
        return {"status": "OK"}

    def add_integration_with_app(self, new_credentials: IntegrationCredentials, domain, user: dict):
        credentials = self.get_credentials(domain_id=domain.id)
        info = self.__get_store_info(store_hash=new_credentials.bigcommerce.shop_domain, 
                                     access_token=new_credentials.bigcommerce.access_token)
        if not info:
            raise HTTPException(status_code=409, detail=IntegrationCredentials.value)
        if info.domain.startswith('https://'):
            info.domain = f'{new_credentials.bigcommerce.shop_domain}'
        if not credentials and info.domain != domain.domain:
            raise HTTPException(status_code=400, detail=IntegrationsStatus.NOT_MATCHED_EARLIER.value)
        integration = self.__save_integrations(store_hash=new_credentials.bigcommerce.shop_domain, 
                                 access_token=new_credentials.bigcommerce.access_token, domain_id=domain.id, user=user)
        self.__set_pixel(user.get('id'), domain, shop_domain=integration.shop_domain, access_token=integration.access_token)
        if not integration:
            raise HTTPException(status_code=409, detail=IntegrationsStatus.CREATE_IS_FAILED.value)
        return integration
    

    def __set_pixel(self, user, domain, shop_domain: str, access_token: str):
        client_id = domain.data_provider_id
        if client_id is None:
            client_id = hashlib.sha256((str(domain.id) + os.getenv('SECRET_SALT')).encode()).hexdigest()
            self.integrations_persistence.db.query(UserDomains).filter(UserDomains.user_id == user.get('id'), UserDomains.domain == domain.domain).update(
                {UserDomains.data_provider_id: client_id},
                synchronize_session=False
            )
            self.integrations_persistence.db.commit() 
        with open('../backend/data/js_pixels/bigcommerce.js', 'r') as file:
            existing_script_code = file.read()

        pixel_bigcommerce = f"window.pixelClientId = '{client_id}';\n" + existing_script_code
        self.AWS.upload_string(pixel_bigcommerce, f'bigcommrce-pixel-code/{client_id}.js')

        script_event_url = f'https://maximiz-data.s3.us-east-2.amazonaws.com/bigcommrce-pixel-code/{client_id}.js'
        url = f"{shop_domain}/v3/content/scripts"
        headers = {
            'X-Auth-Token': access_token,
            'Content-Type': 'application/json'
        }

        script_event_data = {
            "name": "Bigcommerce Pixel Script",
            "description": "Script for Bigcommerce pixel tracking",
            "src": script_event_url, 
            "auto_uninstall": True,
            "load_method": "default",
            "location": "footer",
            "visibility": "all_pages",
            "kind": "src",
            "consent_category": "essential"
        }

        response_event = self.__handle_request(url, method='POST', access_token=access_token, headers=headers, json=script_event_data)
        if response_event.status_code == 200:
            return {'message': 'Successfully'}


    def __get_orders(self, store_hash: str, access_token: str):
        date = datetime.now() - timedelta(hours=24)
        url = f'{store_hash}/v2/orders'
        params = {
            'status_id': 10
        }
        response = self.__handle_request(url, method='GET', access_token=access_token, params=params)
        return response.json()


    def order_sync(self, domain_id: int):
        credential = self.get_credentials(domain_id)
        orders = [self.__mapped_order(order) for order in self.__get_orders(credential.shop_domain, credential.access_token) if order]
        for order in orders:
            try:
                lead_user = self.lead_persistence.get_leads_user_filter_by_email(domain_id, order.email)
                if lead_user and len(lead_user) > 0: 
                    self.lead_orders_persistence.create_lead_order({
                        'platform': 'Bigcommerce',
                        'platform_user_id': order.platform_user_id,
                        'platform_order_id': order.platform_order_id,
                        'lead_user_id': lead_user[0].id,
                        'platform_created_at': order.platform_created_at,
                        'total_price': order.total_price,
                        'currency_code': order.currency_code,
                        'platfrom_email': order.email
                    })
            except: pass
        


    def __mapped_info(self, json):
        return BigCommerceInfo(
            id=json.get('id'),
            account_uuid=json.get('account_uuid'),
            domain=json.get('domain'),
            secure_url=json.get('secure_url'),
            control_panel_base_url=json.get('control_panel_base_url'),
            admin_email=json.get('admin_email'),
            order_email=json.get('order_email')
        )
    

    def __mapped_order(self, json):
        return OrderAPI(
            platform_order_id=json.get('id'),
            platform_user_id=json.get('cutomer_id'),
            email=json.get('billing_address').get('email'),
            total_price=json.get('total_inc_tax'),
            platform_created_at=json.get('date_created'),
            currency_code=json.get('currency_code')
        )