# from httpx import Client
# from woocommerce import API

# from backend.persistence.integrations.integrations_persistence import IntegrationsPresistence
# from backend.persistence.integrations.user_sync import IntegrationsUserSyncPersistence
# from backend.persistence.leads_order_persistence import LeadOrdersPersistence
# from backend.persistence.leads_persistence import LeadsPersistence
# from backend.services.aws import AWSService

# class WoocommerceIntegrationsService:

#     def __init__(self, integration_persistence: IntegrationsPresistence, 
#                  lead_persistence: LeadsPersistence, lead_orders_persistence: LeadOrdersPersistence,
#                  integrations_user_sync_persistence: IntegrationsUserSyncPersistence,
#                  client: Client, aws_service: AWSService):
#         self.integration_persistence = integration_persistence
#         self.lead_persistence = lead_persistence
#         self.lead_orders_persistence = lead_orders_persistence
#         self.integrations_user_sync_persistence = integrations_user_sync_persistence
#         self.client = client
#         self.AWS = aws_service
        
#     def get_credentials(self, domain_id: int):
#         return self.integration_persistence.get_credentials_for_service(domain_id=domain_id, service_name='Woocommerce')
    

#     def __get_orders(self, credentials):
#         ...