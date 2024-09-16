from .abstract import ServiceIntegrationsPersistence 
from models.integrations.shopify_users import ShopifyUser


class ShopifyPersistence(ServiceIntegrationsPersistence):

    model = ShopifyUser
    integration_leads_column = 'shopify_user_id'