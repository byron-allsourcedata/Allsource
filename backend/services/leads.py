from models.users import Users
from persistence.leads_persistence import LeadsPersistence


class LeadsService:
    def __init__(self, leads_persistence_service: LeadsPersistence, user: Users):
        self.leads_persistence_service = leads_persistence_service
        self.user = user

    def get_leads(self, page, per_page, status, from_date, to_date, regions, page_visits, average_time_spent,
                  lead_funnel, emails, recurring_visits):
        return self.leads_persistence_service.get_user_leads(self.user.id, page=page, per_page=per_page,
                                                             status=status, from_date=from_date,
                                                             to_date=to_date,
                                                             regions=regions,
                                                             page_visits=page_visits,
                                                             average_time_spent=average_time_spent,
                                                             lead_funnel=lead_funnel,
                                                             emails=emails,
                                                             recurring_visits=recurring_visits
                                                             )

    def download_leads(self, leads_ids):
        return self.leads_persistence_service.download_leads(leads_ids, self.user.id)

