from models.integrations.klaviyo_users import KlaviyoUser
from .abstract import ServiceIntegrationsPersistence


class KlaviyoPersistence(ServiceIntegrationsPersistence):

    model = KlaviyoUser
    integration_leads_column = 'klaviyo_user_id'