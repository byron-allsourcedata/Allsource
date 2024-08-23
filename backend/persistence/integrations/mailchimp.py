from .abstract import ServiceIntegrationsPersistence
from models.integrations.mailchimp_users import MailchimpUser 


class MailchimpPersistence(ServiceIntegrationsPersistence):

    model = MailchimpUser
    integration_leads_column = 'mailchimp_user_id'