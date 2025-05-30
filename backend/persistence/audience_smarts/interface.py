from abc import ABC, abstractmethod
from typing import Tuple, Optional, List, Any, Dict
from uuid import UUID

from models import AudienceSmart
from persistence.audience_smarts.dto import SyncedPersonRecord, PersonRecord
from schemas.audience import DataSourcesFormat
from sqlalchemy.engine.row import Row


class AudienceSmartsPersistenceInterface(ABC):
    @abstractmethod
    def get_use_case_id_by_alias(self, use_case_alias: str) -> Optional[UUID]:
        pass

    @abstractmethod
    def calculate_smart_audience(self, data: DataSourcesFormat) -> int:
        pass

    @abstractmethod
    def create_audience_smarts_data_sources(
            self,
            smart_audience_id: UUID,
            data_sources: List[Dict]
    ) -> None:
        pass

    @abstractmethod
    def create_audience_smart(
            self,
            name: str,
            user_id: int,
            created_by_user_id: int,
            use_case_alias: str,
            data_sources: List[Dict],
            total_records: int,
            status: str,
            target_schema: str,
            validation_params: Optional[Dict],
            active_segment_records: int,
    ) -> AudienceSmart:
        pass

    @abstractmethod
    def get_audience_smarts(
            self,
            user_id: int,
            page: int,
            per_page: int,
            from_date: Optional[int] = None,
            to_date: Optional[int] = None,
            sort_by: Optional[str] = None,
            sort_order: Optional[str] = None,
            search_query: Optional[str] = None,
            statuses: Optional[List[str]] = None,
            use_cases: Optional[List[str]] = None,
    ) -> Tuple[List[Row], int]:
        pass

    @abstractmethod
    def get_datasources_by_aud_smart_id(self, id: UUID) -> List[Row]:
        pass

    @abstractmethod
    def get_validations_by_aud_smart_id(self, id: UUID) -> Optional[Row]:
        pass

    @abstractmethod
    def search_audience_smart(self, start_letter: str, user_id: int) -> List[Row[Tuple]]:
        pass

    @abstractmethod
    def delete_audience_smart(self, id: int) -> int:
        pass

    @abstractmethod
    def update_audience_smart(self, id: int, new_name: str) -> int:
        pass

    @abstractmethod
    def set_data_syncing_status(self, id: int, status: str) -> int:
        pass

    @abstractmethod
    def get_persons_by_smart_aud_id(
            self,
            smart_audience_id: UUID,
            sent_contacts: int,
            fields: List[str]
    ) -> List[PersonRecord]:
        pass

    @abstractmethod
    def get_synced_persons_by_smart_aud_id(
            self,
            data_sync_id: int,
            enrichment_field_names: List[str]
    ) -> List[SyncedPersonRecord]:
        pass

    @abstractmethod
    def get_processing_sources(self, id: int) -> Optional[Row]:
        pass
