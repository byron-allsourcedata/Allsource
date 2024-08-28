from sqlalchemy.orm import Session
from persistence.leads_persistence import LeadsPersistence
from persistence.integrations.integrations_persistence import IntegrationsPresistence 
import httpx 
from fastapi import HTTPException
from schemas.integrations.klaviyo import KlaviyoCustomer, KlaviyoList
from datetime import datetime
from schemas.integrations.integrations import IntegrationCredentials
from typing import List
import json


class KlaviyoIntegrations:

    def __init__(self, session: Session, integrations_persistence: IntegrationsPresistence, leads_persistence: LeadsPersistence, client: httpx.Client):
        self.session = session
        self.integrations_persistence = integrations_persistence
        self.leads_persistence = leads_persistence
        self.client = client

    def __get_credentials(self, user_id: int):
        return self.integrations_persistence.get_credentials_for_service(user_id, 'Klaviyo')

    def __get_customers(self, api_key: str) -> dict:
        response = self.client.get('https://a.klaviyo.com/api/profiles', headers={
            'Authorization': f'Klaviyo-API-Key {api_key}',
            'revision': '2023-08-15'
        })
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code,
                                detail=response.json().get('errors')[0].get('detail'))
        return response.json().get('data')
    
    def __save_integration(self, api_key: str, user_id: int):
        credentails = {'user_id': user_id, 'access_token': api_key, 'service_name': 'Klaviyo'}
        with self.integrations_persistence as service: 
            integrations = service.create_integration(credentails)
            if not integrations:
                raise HTTPException(status_code=409)
            return integrations
        

    def __save_customer(self, customer: KlaviyoCustomer, user_id: int):
        with self.integrations_persistence as serivce:
            serivce.klaviyo.save_customer(customer.model_dump(), user_id)


    def add_integration(self, credentials: IntegrationCredentials, user):
        customers = [self.__mapped_customer(customer) for customer in self.__get_customers(credentials.klaviyo.api_key)]
        integrataion = self.__save_integration(credentials.klaviyo.api_key, user['id'])
        self.__save_customer(customer for customer in customers)
        return {
            'status': 'Successfuly',
            'detail': {
                'id': integrataion.id,
                'serivce_name': 'Klaviyo'
            }
        }


    def get_list(self, user):
        credentails = self.__get_credentials(user['id'])
        response = self.client.get('https://a.klaviyo.com/api/lists/', headers={
             'Authorization': f'Klaviyo-API-Key {credentails.access_token}',
             'revision': '2023-08-15'
             })
        return [self.__mapped_list(list) for list in response.get('data')]
    

    def __create_list(self, list_name: str, api_key: str):
        response = self.client.post('https://a.klaviyo.com/api/lists', headers={
            'Authorization': f'Klaviyo-API-Key {api_key}',
            'revision': '2024-07-15',
            'accept': 'application/json', 
            'content-type': 'application/js'
            }, data=json.dumps( { "data": { "type": "list", "attributes": { "name": list_name } } } ) )
        if response.status_code != 201:
            raise HTTPException(status_code=response.status_code, detail=response.json().get('errors')[0].get('detail'))
        return self.__mapped_list(response.get('data'))


    def __get_customers_klaiyo_ids(self, customers_ids: int, user_id: int):
        customers_klaviyo_ids = []
        for customer in customers_ids:
            customer_user = self.leads_persistence.get_leads_users_by_lead_id(customer, user_id)
            customers_klaviyo_ids.append(customer_user.klaviyo_user_id)
        return customers_klaviyo_ids
    

    def __create_or_update_klaviyo_cutomer(self, customer, customer_klaviyo_id: int, api_key: str):
        if customer_klaviyo_id:
            with self.integrations_persistence as service:
                customer_klaviyo = service.klaviyo.get_service_user_by_id(customer_klaviyo_id)
        customer_export = self.__mapped_customer_for_klaviyo(customer, customer_klaviyo.klaviyo_user_id)
        response = self.client.post('https://a.klaviyo.com/api/profile-import/', headers={
            'Authorization': f'Klaviyo-API-Key {api_key}',
            'revision': '2024-07-15',
            'accept': 'application/json', 
            'content-type': 'application/js'
        }, data=customer_export)
        if response.status_code not in (201, 200):
            raise HTTPException(status_code=response.status_code, detail=response.json().get('errors')[0].get('detail'))
        return response.json().get('data').get('id')
        
    
    def __add_customer_to_list(self, list_id: str, customer_id: str, api_key: str):
        response = self.client.post(f'https://a.klaviyo.com/api/lists/{list_id}/relationships/profiles/', headers={
            'Authorization': f'Klaviyo-API-Key {api_key}',
            'revision': '2024-07-15',
            'accept': 'application/json', 
            'content-type': 'application/json'
        }, 
        data=json.dumps({"data": {"type": "profile", "id": customer_id}}))
        if response.status_code != 204:
            raise HTTPException(status_code=response.status_code, detail=response.json().get('errors')[0].get('detail'))
        return response.json().get('data')

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
        
# -------------------------------MAPPED-KLAVIYO-DATA------------------------------------ #

    def __mapped_customer(self, customer) -> KlaviyoCustomer:
            attributes = customer.get("attributes", {})
            location = attributes.get("location", {})
            return KlaviyoCustomer(
                klaviyo_user_id=customer["id"],
                first_name=attributes.get('first_name', ''),
                last_name=attributes.get('last_name', ''),
                email=attributes.get("email", ''),
                phone_number=attributes.get("phone_number"),
                ip=location.get("ip"),
                organization=attributes.get("organization"),
                updated_at=datetime.now(),
                external_id=attributes.get("external_id"),
                anonymous_id=attributes.get("anonymous_id"),
                city=location.get("city"),
                zip=location.get("zip"),
                timezone=location.get("timezone"),
            )
    
        
    def __mapped_list(self, list) -> KlaviyoList:
        return KlaviyoList(id=list['id'], list_name=list['attributes']['name'])
    

    def __mapped_customer_for_klaviyo(self, customer, klaviyo_id: int = None):
        json_data = {
            "data": {
                "type": "profile",
                "attributes": {
                    "location": {
                        "address1": customer.company_address or "",
                        "city": customer.company_city or "",
                        "country": "United States",
                        "region": customer.company_state or "",
                        "zip": customer.company_zip or "",
                        "timezone": "America/New_York",
                        "ip": customer.ip or ""
                    },
                    "properties": {
                        "up_id": customer.up_id or "",
                        "trovo_id": customer.trovo_id or "",
                        "partner_id": customer.partner_id or "",
                        "partner_uid": customer.partner_uid or "",
                        "sha256_lower_case": customer.sha256_lower_case or "",
                        "time_spent": customer.time_spent or "",
                        "no_of_visits": customer.no_of_visits or 0,
                        "no_of_page_visits": customer.no_of_page_visits or 0,
                        "age_min": customer.age_min,
                        "age_max": customer.age_max,
                        "gender": customer.gender or "",
                        "company_domain": customer.company_domain or "",
                        "company_phone": customer.company_phone or "",
                        "company_sic": customer.company_sic or "",
                        "company_linkedin_url": customer.company_linkedin_url or "",
                        "company_revenue": customer.company_revenue or "",
                        "company_employee_count": customer.company_employee_count or "",
                        "net_worth": customer.net_worth or "",
                        "job_title": customer.job_title or ""
                    },
                    "email": customer.business_email or "zcx",
                    "phone_number": customer.mobile_phone or "zxc",
                    "first_name": customer.first_name or "zxc",
                    "last_name": customer.last_name or "zxc",
                    "organization": customer.company_name or "zxc",
                    "title": customer.job_title or "zxc",
                }
            }
        }
        if klaviyo_id:
            json_data['data']['id'] = klaviyo_id

        return json.dumps(json_data)