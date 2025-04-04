import logging
from persistence.audience_dashboard import DashboardAudiencePersistence

logger = logging.getLogger(__name__)


class DashboardAudienceService:
    def __init__(self, dashboard_audience_persistence: DashboardAudiencePersistence):
        self.dashboard_persistence = dashboard_audience_persistence

    def get_audience_dashboard_data(self, from_date, to_date, user):
        return self.dashboard_persistence.get_dashboard_audience_data(from_date, to_date, user.get('id'))
