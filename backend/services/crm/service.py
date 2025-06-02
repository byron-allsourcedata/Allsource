from resolver import injectable
from services.crm.hubspot.api import HubspotAPI
from services.crm.hubspot.schemas import NewContactCRM, HubspotLeadStatus


@injectable
class CrmService:
    def __init__(self, hubspot: HubspotAPI):
        self.hubspot = hubspot

    def add_contact(self, new_contact: NewContactCRM):
        return self.hubspot.add_contact(new_contact)

    def update_status(self, email: str, new_status: HubspotLeadStatus):
        return self.hubspot.update_status(email, new_status)