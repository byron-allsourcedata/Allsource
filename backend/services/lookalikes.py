import csv
import io
from utils import format_phone_number
from persistence.lookalikes import LookalikesPersistence
from datetime import datetime, timedelta


class LookalikesService:
    def __init__(self, lookalikes_persistence_service: LookalikesPersistence ):
        self.lookalikes_persistence_service = lookalikes_persistence_service

    def get_source_info(self, uuid_of_source, user):
        source_info = self.lookalikes_persistence_service.get_source_info(uuid_of_source, user)
        return source_info