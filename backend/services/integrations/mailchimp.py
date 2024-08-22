from fastapi import HTTPException
from models.users import User
from persistence.integrations.integrations_persistence import IntegrationsPresistence
from .utils import mapped_customers, IntegrationsABC
import mailchimp_marketing as MailchimpMarketing
from mailchimp_marketing.api_client import ApiClientError

class MailchimpIntegrations(IntegrationsABC):

    def __init__(self, user_integration_persistence: IntegrationsPresistence, user: User):
        self.user_integration_persistence = user_integration_persistence
        self.user = user

    def get_customers(self, data_center: str, store_id: int, access_token: str):
        try:
            client = MailchimpMarketing.Client()
            client.set_config({
                "api_key": access_token,
                "server": data_center
            })
            response = client.ecommerce.get_all_store_customers(store_id)
            return mapped_customers('mailchimp', response['customers'])
        except ApiClientError as error:
            raise HTTPException(status_code=400, detail=error)
        
    def create_integration(self, data_center: str, store_id: int, access_token: str):
        data = {
            'user_id': self.user['id'],
            'data_center': data_center,
            'shop_domain': store_id,
            'access_token': access_token,
            'service_name': 'mailchimp'
        }
        existing_integration = self.user_integration_persistence.get_user_integrations_by_service(self.user['id'], 'mailchimp')
        if existing_integration:
            updated_integration = self.user_integration_persistence.edit_integrations(self.user['id'], 'mailchimp', data)
            return updated_integration
        else:
            new_integration = self.user_integration_persistence.create_integration(data)
            return self.get_customers(new_integration.shop_domain, new_integration.access_token)