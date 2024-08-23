from .abstract import ServiceIntegrationsPersistence
from models.integrations.bigcommerce_users import BigCommerceUser


class BigcommercePersistence(ServiceIntegrationsPersistence):

    model = BigCommerceUser
    integration_leads_column = 'bigcommerce_user_id'