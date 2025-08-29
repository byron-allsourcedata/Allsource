from sqlalchemy import select
from db_dependencies import Db
from domains.integrations.schemas import (
    PremiumSourceIntegration,
    PremiumSourceIntegrationStatus,
)
from models.integrations.users_domains_integrations import UserIntegration
from persistence.integrations.integrations_persistence import (
    IntegrationsPersistence,
)
from resolver import injectable


@injectable
class IntegrationsService:
    def __init__(self, db: Db, repo: IntegrationsPersistence):
        self.repo = repo
        self.db = db

    def _repo_by_id(self, integration_id: int):
        return self.db.execute(
            select(UserIntegration).where(UserIntegration.id == integration_id)
        ).scalar()

    def by_id(self, integration_id: int) -> UserIntegration | None:
        return self._repo_by_id(integration_id)

    def get_premium_sources_integrations(
        self, user_id: int
    ) -> list[PremiumSourceIntegration]:
        result = self.repo.get_premium_sources_integrations(user_id)

        syncs: list[PremiumSourceIntegration] = []
        for integration, user_integration_id, is_active, is_failed in result:
            schema = PremiumSourceIntegration(
                integration_id=user_integration_id,
                service_name=integration.service_name,
                image=integration.image_url,
                status=self._get_integration_status(is_active, is_failed),
            )

            syncs.append(schema)

        return syncs

    def _get_integration_status(
        self, is_integrated: bool, is_failed: bool
    ) -> PremiumSourceIntegrationStatus:
        if is_failed:
            return PremiumSourceIntegrationStatus.FAILED
        if is_integrated:
            return PremiumSourceIntegrationStatus.INTEGRATED
        return PremiumSourceIntegrationStatus.NOT_INTEGRATED
