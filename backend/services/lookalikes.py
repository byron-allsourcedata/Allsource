import csv
import io
from utils import format_phone_number
from persistence.lookalikes import LookalikesPersistence
from enums import BaseEnum
from datetime import datetime, timedelta


class LookalikesService:
    def __init__(self, user, lookalikes_persistence_service: LookalikesPersistence):
        self.user = user
        self.lookalikes_persistence_service = lookalikes_persistence_service

    def get_source_info(self, uuid_of_source):
        source_info = self.lookalikes_persistence_service.get_source_info(uuid_of_source, self.user.get('id'))
        if source_info:
            sources, created_by = source_info
            return {
                'name': sources.name,
                'source': sources.source_origin,
                'type': sources.source_type,
                'created_date': sources.created_at,
                'created_by': created_by,
                'number_of_customers': sources.total_records,
                'matched_records': sources.matched_records,
            }
        return {}

    def create_lookalike(self, uuid_of_source, lookalike_size, lookalike_name, created_by_user_id):
        lookalike = self.lookalikes_persistence_service.create_lookalike(
            uuid_of_source, self.user.get('id'), lookalike_size, lookalike_name, created_by_user_id
        )
        return {
            'status': BaseEnum.SUCCESS,
            'lookalike': lookalike
        }
    