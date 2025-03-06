import csv
import io
from utils import format_phone_number
from persistence.lookalikes import LookalikesPersistence
from datetime import datetime, timedelta


class LookalikesService:
    def __init__(self, user, lookalikes_persistence_service: LookalikesPersistence):
        self.user = user
        self.lookalikes_persistence_service = lookalikes_persistence_service

    def get_source_info(self, uuid_of_source):
        source_info = self.lookalikes_persistence_service.get_source_info(uuid_of_source, self.user.get('id'))
        if source_info:
            return {
                'name': source_info.name,
                'source': source_info.source_origin,
                'type': source_info.source_type,
                'created_date': source_info.created_at,
                'created_by': source_info.created_by,
                'number_of_customers': source_info.total_records,
                'matched_records': source_info.matched_records,
            }
        return {}

    def create_lookalike(self, uuid_of_source, lookalike_size, lookalike_name, created_by_user_id):
        self.lookalikes_persistence_service.create_lookalike(uuid_of_source, self.user.get('id'),
                                                             lookalike_size, lookalike_name, created_by_user_id)
        return "OK"
