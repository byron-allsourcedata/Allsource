from abc import ABC, abstractmethod
from typing import List
from models import AudienceLookalikes


class ProfileFetcherInterface(ABC):
    @abstractmethod
    def fetch_profiles(self, selected_columns: List[str], asids: List[str]) -> List[dict]:
        pass

    @abstractmethod
    def fetch_profiles_from_lookalike(self, audience_lookalike: AudienceLookalikes) -> List[dict]:
        pass
