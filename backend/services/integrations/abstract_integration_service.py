from abc import ABC, abstractmethod
from typing import TypedDict

from enums import ProccessDataSyncStatusLiteral
from models import (
    LeadUser,
    FiveXFiveUser,
    IntegrationUserSync,
    UserIntegration,
    UserDomains,
)
from persistence.user_persistence import UserDict
from schemas.integrations.integrations import IntegrationCredentials, DataMap


class IntegrationLeadStatus(TypedDict):
    lead_id: int
    status: ProccessDataSyncStatusLiteral


class AbstractIntegrationService(ABC):
    @abstractmethod
    async def process_data_sync_lead(
        self,
        user_integration: UserIntegration,
        integration_data_sync: IntegrationUserSync,
        user_data: list[tuple[LeadUser, FiveXFiveUser]],
        is_email_validation_enabled: bool,
    ) -> list[IntegrationLeadStatus]:
        raise NotImplementedError

    @abstractmethod
    def add_integration(
        self,
        credentials: IntegrationCredentials,
        domain: UserDomains,
        user: UserDict,
    ) -> UserIntegration:
        raise NotImplementedError

    @abstractmethod
    async def create_sync(
        self,
        domain_id: int,
        created_by: str,
        user: UserDict,
        leads_type: str | None,
        data_map: list[DataMap] | None,
    ):
        raise NotImplementedError

    @abstractmethod
    def edit_sync(
        self,
        domain_id: int,
        created_by: str,
        user_id: int,
        integrations_users_sync_id: int | None,
        leads_type: str | None,
        data_map: list[DataMap] | None,
    ):
        raise NotImplementedError
