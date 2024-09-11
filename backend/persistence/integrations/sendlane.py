from .abstract import ServiceIntegrationsPersistence
from models.integrations.sendlane_user import SendlaneUser


class SendlanePersistence(ServiceIntegrationsPersistence):
    model = SendlaneUser

    integration_leads_column = 'sendlane_user_id'
