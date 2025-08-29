from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import select
from db_dependencies import Db
from models.integrations.users_domains_integrations import UserIntegration
from resolver import injectable
from models.premium_source_sync import PremiumSourceSync


@injectable
class PremiumSourceSyncPersistence:
    def __init__(self, db: Db) -> None:
        self.db = db

    def list_by_user_id(self, user_id: int):
        syncs = (
            self.db.execute(
                select(PremiumSourceSync)
                .join(
                    UserIntegration,
                    UserIntegration.id == PremiumSourceSync.user_integration_id,
                )
                .where(UserIntegration.user_id == user_id)
            )
            .scalars()
            .all()
        )

        return list(syncs)

    def by_source_id(self, source_id: UUID) -> list[PremiumSourceSync]:
        syncs = (
            self.db.execute(
                select(PremiumSourceSync).where(
                    PremiumSourceSync.premium_source_id == source_id
                )
            )
            .scalars()
            .all()
        )

        return list(syncs)

    def create_sync(
        self, premium_source_id: UUID, user_integration_id: int
    ) -> UUID:
        creation_time = datetime.now(timezone.utc)
        sync_id = uuid4()
        sync = PremiumSourceSync(
            id=sync_id,
            premium_source_id=premium_source_id,
            user_integration_id=user_integration_id,
            status="created",
            created_at=creation_time,
            updated_at=creation_time,
        )

        self.db.add(sync)
        self.db.flush()

        return sync_id

    def credentials_by_premium_sync_id(
        self, premium_sync_id: UUID
    ) -> UserIntegration | None:
        integration = self.db.execute(
            select(UserIntegration)
            .select_from(PremiumSourceSync)
            .where(PremiumSourceSync.id == premium_sync_id)
            .join(
                UserIntegration,
                UserIntegration.id == PremiumSourceSync.user_integration_id,
            )
        ).scalar()
        return integration
