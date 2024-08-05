import logging

from enums import AudienceInfoEnum
from models.users import Users
from persistence.audience_persistence import AudiencePersistence

logger = logging.getLogger(__name__)


class AudienceService:
    def __init__(self, user: Users, audience_persistence_service: AudiencePersistence):
        self.user = user
        self.audience_persistence_service = audience_persistence_service

    def get_audience(self, page, per_page):
        return self.audience_persistence_service.get_user_audience(self.user.id, page=page, per_page=per_page)

    def get_user_audience_list(self):
        return self.audience_persistence_service.get_user_audience_list(self.user.id)

    def post_audience(self, leads_ids, audience_name):
        return self.audience_persistence_service.create_user_audience(self.user.id, leads_ids, audience_name)

    def put_audience(self, leads_ids, remove_leads_ids, audience_ids, new_audience_name):
        for audience_id in audience_ids:
            self.audience_persistence_service.change_user_audience(self.user.id, leads_ids, remove_leads_ids,
                                                                audience_id, new_audience_name)
        return AudienceInfoEnum.SUCCESS

    def delete_audience(self, audience_ids):
        for audience_id in audience_ids:
            self.audience_persistence_service.delete_user_audience(self.user.id, audience_id)
        return AudienceInfoEnum.SUCCESS
