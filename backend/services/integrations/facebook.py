import os
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from httpx import Client
from fastapi import HTTPException
from dotenv import load_dotenv

class FacebookIntegrations:

    
    def __init__(self, integration_persistence: IntegrationsPresistence, client: Client) -> None:
        load_dotenv()
        self.client = client
        self.app_id = os.getenv('FACEBOOK_APP_ID')
        self.app_secret = os.getenv('FACEBOOK_APP_SECRET')
        self.integration_persistence = integration_persistence

    def __get_longLiveToken(self, short_live_access_token: str):
        url = f'https://graph.facebook.com/v17.0/oauth/access_token?grant_type=fb_exchange_token&client_id={self.appId}&client_secret={self.appSecret}&fb_exchange_token={short_live_access_token}'
        response = self.client.get(url)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail='Getting Long Live Token failed')
        return response.json()
    
    def __save_integration(self, short_live_access_token: str, ad_account_id: str, page_id: str, domain_id: int):
        long_live_token = self.__get_longLiveToken(short_live_access_token)
        with self.integration_persistence as service: 
            crendentials = {'domain_id': domain_id, 'service_name': 'Facebook', 
                            'access_token': long_live_token['access_token'],
                            'expires_in': long_live_token['expires_in'],
                            'ad_account_id': ad_account_id, 'page_id': page_id}
            integration = service.create_integration(crendentials)
            if not integration:
                raise HTTPException(status_code=409, detail={'status': 'error', 'detail': {
                    'message': 'integration be created'
                }})
            return integration
        
    def __get_forms(self, access_token: str, page_id: str, ad_account_id: str):
        response = self.client.get(f'https://graph.facebook.com/v20.0/{page_id}/leadgen_forms', params={
                            "fields": "name,id",
                            "access_token": access_token    
                        })
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail={'status': 'error', 'detail': {
                'message': 'Getting forms failed'
            }})
