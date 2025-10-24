import logging
from datetime import datetime
from uuid import UUID

from models.audience_sources import AudienceSource
from typing import Optional, Tuple, List, Any
from sqlalchemy.engine.row import Row
from .interface import AudienceSourcesPersistenceInterface
from .postgres import AudienceSourcesPostgresPersistence
from .clickhouse import AudienceSourcesClickhousePersistence

from resolver import injectable

logger = logging.getLogger(__name__)


@injectable
class AudienceSourcesUnifiedPersistence(AudienceSourcesPersistenceInterface):
    def __init__(
        self,
        postgres: AudienceSourcesPostgresPersistence,
        clickhouse: AudienceSourcesClickhousePersistence,
    ):
        self.postgres = postgres
        self.clickhouse = clickhouse

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
        return self.postgres.get_sources(
            user_id,
            page,
            per_page,
            sort_by,
            sort_order,
            name,
            source_origin,
            source_type,
            domain_name,
            created_date_start,
            created_date_end,
        )

    def get_completed_sources_by_user(
        self,
        user_id: int,
    ) -> Tuple[List[Row], int]:
        return self.postgres.get_completed_sources_by_user(user_id)

    def get_source_by_id(self, source_id) -> Optional[AudienceSource]:
        return self.postgres.get_source_by_id(source_id)

    def create_source(self, **creating_data) -> Optional[AudienceSource]:
        return self.postgres.create_source(**creating_data)

    def delete_source(self, source_id: int) -> int:
        return self.postgres.delete_source(source_id)

    def get_domains_source(self, user_id: int, page: int, per_page: int):
        return self.postgres.get_domains_source(user_id, page, per_page)

    def get_processing_sources(self, source_id: UUID):
        return self.postgres.get_processing_sources(source_id)

    def get_source_for_regenerate(self, source_id: UUID):
        return self.postgres.get_source_for_regenerate(source_id)

    def get_significant_fields(self, source_id: UUID):
        return self.postgres.get_significant_fields(source_id)

    def get_matching_info(self, source_id: UUID):
        return self.postgres.get_matching_info(source_id)

    def get_problematic_sources(self) -> List[dict[str, Any]]:
        return self.postgres.get_problematic_sources()
