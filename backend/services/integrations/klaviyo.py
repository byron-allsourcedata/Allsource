from fastapi import HTTPException
from httpx import Client
from schemas.integrations.klaviyo import KlaviyoUsersScheme
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from typing import List, Any
from datetime import datetime
import logging
from .utils import IntegrationsABC
from persistence.audience_persistence import AudiencePersistence
from persistence.leads_persistence import LeadsPersistence, LeadUser, Lead
import json



class KlaviyoIntegrations(IntegrationsABC):

    def __init__(self, integration_persistence: IntegrationsPresistence,
                 client: Client, audience_persistence: AudiencePersistence, leads_persistence: LeadsPersistence,
                 user):
        self.integration_persistence = integration_persistence
        self.client = client
        self.user = user
        self.audience_persistence = audience_persistence
        self.leads_persistence = leads_persistence


    def get_all_leads(self, api_key: str):
        logging.info(f'Get leads from Klaviyo <- email: {self.user["email"]}, Klaviyo-API-Key: {api_key}')
        response = self.client.get('https://a.klaviyo.com/api/profiles/', 
                                   headers={'Authorization': f'Klaviyo-API-Key {api_key}', 'revision': '2023-08-15'})
        logging.info(f'Response Klaviyo {response.status_code}')
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail='Klaviyo credentials invalid')
        return response.json().get('data')
    

    def save_integrations(self, api_key: str):
        credentials = {'user_id': self.user['id'], 'access_token': api_key, 'service_name': 'klaviyo'}
        integration = self.integration_persistence.get_user_integrations_by_service(self.user['id'], 'klaviyo')
        if not integration:
            logging.info(f'{self.user["email"]} create integration Klaviyo')
            integration = self.integration_persistence.create_integration(credentials)
            return integration
        logging.info(f'{self.user["email"]} update integration Klaviyo')
        self.integration_persistence.edit_integrations(integration.id, credentials)
        return


    def save_leads(self, leads: List[KlaviyoUsersScheme]):
        for lead in leads:
            with self.integration_persistence as persistence:
                persistence.klaviyo.save_leads(lead.model_dump(), self.user['id'])


    def create_integration(self, api_key: str):
        leads = self.get_all_leads(api_key)
        self.save_integrations(api_key)
        self.save_leads(self.mapped_leads(leads))
        return


    def __get_lists_upd_crt_leads_by_audience(self, list_name: str) -> tuple[List[LeadUser], List[LeadUser]]:
        audience = self.audience_persistence.get_audience_by_name(list_name, self.user['id'])
        if not audience:
            raise HTTPException(status_code=404, detail='audience not found')
        leads = self.audience_persistence.get_audience_leads_by_audience_id(audience.id)
        for_update = []
        for_create = []
        for lead in leads:
            lead_user = self.leads_persistence.get_leads_users_by_lead_id(lead.lead_id, self.user['id'])
            if lead_user:
                if lead_user.klaviyo_user_id is not None: 
                    for_update.append(lead_user)
                else:
                    for_create.append(lead_user)  
        return for_update, for_create


    def get_leads_by_list(self, list_id: str, api_key: str):
        response = self.client.get(f'https://a.klvaiyo.com/api/lists/{list_id}/profiles/', 
                                   headers={'Authorizations': f'Klaviyo-API-Key {api_key}',
                                            'revision': '2024-07-15'}) 
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.json().get('errors')[0].get('detail'))
        return response.json().get('data')


    def __list_create(self, list_name: str, api_key: str):
        response = self.client.post('https://a.klaviyo.com/api/lists', headers={
            'Authorization': f'Klaviyo-API-Key {api_key}',
            'revision': '2024-07-15',
            'accept': 'application/json', 
            'content-type': 'application/json'
        }, data=json.dumps( { "data": { "type": "list", "attributes": { "name": list_name } } } ) ) 
        if response.status_code != 201:
            raise HTTPException(status_code=response.status_code, detail=response.json().get('errors')[0].get('detail'))
        return response.json().get('data')

    def __get_list_by_name(self, list_name: str, api_key: str):
        response = self.client.get('https://a.klaviyo.com/api/lists/', headers={
            'Authorizatoin': f'Klaviyo-API-Key {api_key}',
            'revision': '2024-07-15'
        })
        for res in response.json().get('data'):
            if res['attributes']['name'] == list_name:
                return res 
            
    def __lead_to_klaviyo_profile_post(self, lead_user: LeadUser, api_key: str):
        lead = self.leads_persistence.get_lead_data(lead_user.lead_id)
        data = self.__mapped_to_klaviyo_post_json_lead(lead)
        response = self.client.post('https://a.klaviyo.com/api/profiles/', headers={
            'Authorization': f'Klaviyo-API-Key {api_key}',
            'revision': '2024-07-15',
            'accept': 'application/json', 
            'content-type': 'application/json'
        }, data=data)
        if response.status_code == 201:
            return response.json().get('data')
        else:
            logging.info(f'POST Klaviyo Profile, User_ID: {lead_user.user_id}, Lead_id: {lead_user.lead_id}, Klaviyo_id: {lead_user.klaviyo_user_id}')
    
    def __lead_to_klaviyo_profile_patch(self, lead_user: LeadUser, api_key: str):
        with self.integration_persistence as persistence:
                klaviyo_user = persistence.klaviyo.get_service_user_by_id(lead_user.klaviyo_user_id)
        lead = self.leads_persistence.get_lead_data(lead_user.lead_id)
        data = self.__mapped_to_klaviyo_patch_json_lead(lead, klaviyo_user.klaviyo_user_id)
        response = self.client.patch(f'https://a.klaviyo.com/api/profiles/{klaviyo_user.klaviyo_user_id}', headers={
            'Authorization': f'Klaviyo-API-Key {api_key}',
            'revision': '2024-07-15',
            'accept': 'application/json', 
            'content-type': 'application/json'
        }, data=data)
        if response.status_code == 200:
            return response.json().get('data')
        else: logging.info(f'PATCH Klaviyo Profile, User_ID: {lead_user.user_id}, Lead_id: {lead_user.lead_id}, Klaviyo_id: {lead_user.klaviyo_user_id}')
    

    def save_leads_to_list(self, users_ids: List[int], list_id: str, api_key: str):
        response = self.client.post(f'https://a.klaviyo.com/api/lists/{list_id}/relationships/profiles/', headers={
            'Authorization': f'Klaviyo-API-Key {api_key}',
            'revision': '2024-07-15',
            'accept': 'application/json', 
            'content-type': 'application/json'
        }, 
        data=json.dumps({"data": [{"type": "profile", "id": id} for id in users_ids]}))
        if response.status_code != 204:
            raise HTTPException(status_code=response.status_code, detail=response.json().get('errors')[0].get('detail'))
        return True


    def export_leads(self, list_name: str):
        credentials = self.integration_persistence.get_user_integrations_by_service(self.user['id'], 'klaviyo')
        if not credentials:
            raise HTTPException(status_code=404, detail='Klaviyo integrations not found')
        audience = self.__get_list_by_name(list_name, credentials.access_token)
        list_id = audience['id']
        if not list_id:
            audience = self.__list_create(list_name, credentials.access_token)
            list_id = audience['id']
        upd, created = self.__get_lists_upd_crt_leads_by_audience(list_name)
        users_ids = []
        for item in created: 
            klaviyo_user = self.__lead_to_klaviyo_profile_post(item, credentials.access_token)
            users_ids.append(klaviyo_user['id'])
        for item in upd:
            klaviyo_user = self.__lead_to_klaviyo_profile_patch(item, credentials.access_token)
            users_ids.append(klaviyo_user['id'])
        return self.save_leads_to_list(users_ids, list_id, credentials.access_token)


    def auto_sync(self, audience_id: int, auto_sync: bool):
        with self.integration_persistence as service:
            credentials = service.get_user_integrations_by_service(self.user['id'], 'klaviyo')
        if not credentials:
            raise HTTPException(status_code=404, detail='Klaviyo integrations not found')
        audience = self.audience_persistence.get_audience_by_id(audience_id)
        if not audience:
            raise HTTPException(status_code=404, detail='Audience not found')
        self.audience_persistence.update_auto_sync(audience_id, auto_sync)
        logging.info(f'User {self.user["email"]} set auto_sync to {auto_sync} for audience {audience_id}')
        if auto_sync:
            self.export_leads(audience.name)
        return {"status": "success", "auto_sync": auto_sync}    
        
    # MAPEED FUNC FOR KLAVIYO 

    def mapped_leads(self, leads: List[Any]) -> List[KlaviyoUsersScheme]:
        klaviyo_users = []
        for lead in leads:
            attributes = lead.get("attributes", {})
            location = attributes.get("location", {})
            klaviyo_users.append(KlaviyoUsersScheme(
                klaviyo_user_id=lead["id"],
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
            ))
        return klaviyo_users

    def __mapped_to_klaviyo_post_json_lead(self, lead: Lead) -> str:
        return json.dumps({
            "data": {
                "type": "profile",
                "attributes": {
                    "location": {
                        "address1": lead.company_city or "",
                        "city": lead.company_city or "",
                        "country": "United States",
                        "region": lead.company_state or "",
                        "zip": lead.company_zip or "",
                        "timezone": "America/New_York",
                        "ip": lead.ip or ""
                    },
                    "email": lead.business_email or "",
                    "phone_number": lead.mobile_phone or "",
                    "last_name": lead.last_name or "",
                    "first_name": lead.first_name or "",
                    "organization": lead.company_name or "",
                    "title": lead.job_title or "",
                    "properties": {
                        "up_id": lead.up_id or "",
                        "trovo_id": lead.trovo_id or "",
                        "partner_id": lead.partner_id or "",
                        "partner_uid": lead.partner_uid or "",
                        "sha256_lower_case": lead.sha256_lower_case or "",
                        "time_spent": lead.time_spent or "",
                        "no_of_visits": lead.no_of_visits,
                        "no_of_page_visits": lead.no_of_page_visits,
                        "age_min": lead.age_min,
                        "age_max": lead.age_max,
                        "gender": lead.gender or "",
                        "company_domain": lead.company_domain or "",
                        "company_phone": lead.company_phone or "",
                        "company_sic": lead.company_sic or "",
                        "company_linkedin_url": lead.company_linkedin_url or "",
                        "company_revenue": lead.company_revenue or "",
                        "company_employee_count": lead.company_employee_count or "",
                        "net_worth": lead.net_worth or "",
                        "job_title": lead.job_title or ""
                    }
                }
            }
        })

    def __mapped_to_klaviyo_patch_json_lead(self, lead: Lead, klaviyo_id: str) -> str:
        json_data = {
            "data": {
                "type": "profile",
                "id": klaviyo_id,
                "attributes": {
                    "location": {
                        "address1": lead.company_address or "",
                        "city": lead.company_city or "",
                        "country": "United States",
                        "region": lead.company_state or "",
                        "zip": lead.company_zip or "",
                        "timezone": "America/New_York",
                        "ip": lead.ip or ""
                    },
                    "properties": {
                        "up_id": lead.up_id or "",
                        "trovo_id": lead.trovo_id or "",
                        "partner_id": lead.partner_id or "",
                        "partner_uid": lead.partner_uid or "",
                        "sha256_lower_case": lead.sha256_lower_case or "",
                        "time_spent": lead.time_spent or "",
                        "no_of_visits": lead.no_of_visits or 0,
                        "no_of_page_visits": lead.no_of_page_visits or 0,
                        "age_min": lead.age_min,
                        "age_max": lead.age_max,
                        "gender": lead.gender or "",
                        "company_domain": lead.company_domain or "",
                        "company_phone": lead.company_phone or "",
                        "company_sic": lead.company_sic or "",
                        "company_linkedin_url": lead.company_linkedin_url or "",
                        "company_revenue": lead.company_revenue or "",
                        "company_employee_count": lead.company_employee_count or "",
                        "net_worth": lead.net_worth or "",
                        "job_title": lead.job_title or ""
                    },
                    "email": lead.business_email or "zcx",
                    "phone_number": lead.mobile_phone or "zxc",
                    "first_name": lead.first_name or "zxc",
                    "last_name": lead.last_name or "zxc",
                    "organization": lead.company_name or "zxc",
                    "title": lead.job_title or "zxc",
                }
            }
        }

        return json.dumps(json_data)
