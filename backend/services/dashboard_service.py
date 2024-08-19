import logging
from models.users import Users

logger = logging.getLogger(__name__)


class DashboardService:
    def __init__(self, user):
        self.user = user

    def get_my_info(self):
        return {"email": self.user.get('email'),
                "full_name": self.user.get('full_name')}


