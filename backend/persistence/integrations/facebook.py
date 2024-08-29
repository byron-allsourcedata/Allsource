from .abstract import ServiceIntegrationsPersistence
# from models.integrations.facebook_users import FacebookUsers


class FacebookPersistence(ServiceIntegrationsPersistence):

    # model = FacebookUsers

    integration_leads_column = 'facebook_user_id'