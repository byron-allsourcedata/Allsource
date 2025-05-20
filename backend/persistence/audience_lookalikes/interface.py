import abc
from typing import Tuple, Optional, List, Any

from models import AudienceSource, Users


class AudienceLookalikesPersistenceInterface(abc.ABC):


    @abc.abstractmethod
    def get_source_info(self, uuid_of_source, user_id) -> Optional[Tuple[AudienceSource, str]]:
        pass

    @abc.abstractmethod
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
            search_query: Optional[str] = None
    ) -> Tuple[List[Any], int, int, int]:
        pass

