from models.users import Users
from persistence.leads_persistence import LeadsPersistence


class LeadsService:
    def __init__(self, leads_persistence_service: LeadsPersistence, user: Users):
        self.leads_persistence_service = leads_persistence_service
        self.user = user

    def get_leads(self, page, per_page, filter):
        return self.leads_persistence_service.get_user_leads_by_status(self.user.id, page=page, per_page=per_page,
                                                                           filter=filter)

