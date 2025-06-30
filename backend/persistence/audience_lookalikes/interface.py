import abc
from abc import abstractmethod
from typing import Tuple, Optional, List
from uuid import UUID

from models import AudienceLookalikes
from .dto import SourceInfo, LookalikeInfo


class AudienceLookalikesPersistenceInterface(abc.ABC):
    @abstractmethod
    def get_source_info(self, uuid_of_source, user_id) -> Optional[SourceInfo]:
        pass

    @abstractmethod
    def get_lookalikes(
        self,
        user_id: int,
        page: Optional[int] = None,
        per_page: Optional[int] = None,
        from_date: Optional[int] = None,
        to_date: Optional[int] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None,
        lookalike_size: Optional[str] = None,
        lookalike_type: Optional[str] = None,
        search_query: Optional[str] = None,
        include_json_fields: bool = False,
    ) -> Tuple[List[LookalikeInfo], int, int, int]:
        pass

    @abstractmethod
    def get_lookalike(self, lookalike_id: UUID) -> Optional[AudienceLookalikes]:
        pass

    @abstractmethod
    def get_max_size(self, lookalike_size: str) -> int:
        pass

    @abstractmethod
    def update_dataset_size(self, lookalike_id: UUID, dataset_size: int):
        pass
