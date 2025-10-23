from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Tuple, Optional, List
from uuid import UUID

from sqlalchemy.engine.row import Row
from models.audience_sources import AudienceSource


class AudienceSourcesPersistenceInterface(ABC):
    @abstractmethod
    def get_sources(
        self,
        user_id: int,
        page: int,
        per_page: int,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None,
        name: Optional[str] = None,
        source_origin: Optional[str] = None,
        source_type: Optional[str] = None,
        domain_name: Optional[str] = None,
        created_date_start: Optional[datetime] = None,
        created_date_end: Optional[datetime] = None,
    ) -> Tuple[List[Row], int]:
        pass

    @abstractmethod
    def get_completed_sources_by_user(
        self,
        user_id: int,
    ) -> Tuple[List[Row], int]:
        pass

    @abstractmethod
    def get_source_by_id(self, source_id) -> Optional[AudienceSource]:
        pass

    @abstractmethod
    def create_source(self, **creating_data) -> Optional[AudienceSource]:
        pass

    @abstractmethod
    def delete_source(self, source_id: int) -> int:
        pass

    @abstractmethod
    def get_domains_source(self, user_id: int, page: int, per_page: int):
        pass

    @abstractmethod
    def get_processing_sources(self, source_id: UUID):
        pass

    @abstractmethod
    def get_source_for_regenerate(self, source_id: UUID):
        pass

    @abstractmethod
    def get_significant_fields(self, source_id: UUID):
        pass

    @abstractmethod
    def get_matching_info(self, source_id: UUID):
        pass

    @abstractmethod
    def get_problematic_sources(self) -> List[dict[str, Any]]:
        pass

    @abstractmethod
    def delete_logs_by_source_id(self, source_id):
        pass
