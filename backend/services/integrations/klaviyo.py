from sqlalchemy.orm import Session
from fastapi import HTTPException
from httpx import Client
from models.users import User
from persistence.users_integrations_persistence import UserIntegrationsPresistence
from .utils import mapped_customers, IntegrationsABC
from datetime import datetime
class KlaviyoIntegrations(IntegrationsABC):

    def __init__(self, db: Session, user_integration_persistence: UserIntegrationsPresistence, client: Client, user):
        self.user_integration_persistence = user_integration_persistence
        self.db = db
        self.client = client
        self.user = user
        

    def get_customers(self, access_token: str):
        custromers_url = f'https://a.klaviyo.com/api/profiles/'
        response = self.client.get(custromers_url, headers={'Authorization': f'Klaviyo-API-Key {access_token}', 'revision': '2023-12-15'})
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail='Invalid or Klaviyo-API-Key')
        customers = response.json().get('data', [])
        return mapped_customers('klaviyo', customers)
        


    def create_integration(self, access_token: str):
        data = {
            'user_id': self.user['id'],
            'access_token': access_token,
            'service_name': 'klaviyo'
        }
        existing_integration = self.user_integration_persistence.get_user_integrations_by_service(self.user['id'], 'klaviyo')
        if existing_integration:
            self.user_integration_persistence.edit_integrations(self.user['id'], 'klaviyo', data)
            return self.get_customers(access_token)
        else:
            new_integration = self.user_integration_persistence.create_integration(data)
            return self.get_customers(new_integration.access_token)
        
