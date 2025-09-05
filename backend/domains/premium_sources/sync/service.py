from datetime import datetime, timezone
import logging
from uuid import UUID
from domains.premium_sources.table.persistence import PremiumSourcePersistence
from domains.premium_sources.premium_sources_rows.service import (
    PremiumSourcesRowsService,
)
from domains.premium_sources.sync.integrations.google_ads import (
    GoogleAdsPremiumSourceSyncService,
)
from domains.premium_sources.sync.integrations.meta import (
    MetaPremiumSourceSyncService,
)
from domains.premium_sources.sync.persistence import (
    PremiumSourceSyncPersistence,
)
from domains.premium_sources.sync.schemas import (
    CreateGoogleAdsPremiumSyncRequest,
    CreateMetaPremiumSyncRequest,
    PremiumSyncSchema,
)
from domains.premium_sources.sync_log.persistence import (
    PremiumSourceSyncLogPersistence,
)
from models.premium_source_sync import PremiumSourceSync
from resolver import injectable

logger = logging.getLogger(__name__)


@injectable
class PremiumSourceSyncService:
    def __init__(
        self,
        repo: PremiumSourceSyncPersistence,
        source_repo: PremiumSourcePersistence,
        sync_log: PremiumSourceSyncLogPersistence,
        source_rows: PremiumSourcesRowsService,
        google_ads: GoogleAdsPremiumSourceSyncService,
        meta: MetaPremiumSourceSyncService,
    ) -> None:
        self.repo = repo
        self.source_repo = source_repo
        self.google_ads = google_ads
        self.meta = meta
        self.source_rows = source_rows
        self.sync_log = sync_log

    def create_sync_checked(
        self, user_id: int, premium_source_id: UUID, user_integration_id: int
    ) -> UUID:
        """
        Flushes, no commit
        """
        # premium source exists
        # user integration exists
        # user owns premium source
        # user owns integration
        sync_id = self.repo.create_sync(
            premium_source_id=premium_source_id,
            user_integration_id=user_integration_id,
        )
        return sync_id

    def by_source_id(self, source_id: UUID) -> list[PremiumSourceSync]:
        return self.repo.by_source_id(source_id)

    def list(self, user_id: int) -> list[PremiumSyncSchema]:
        # TODO: rewrite it into single query

        sync_schemas: list[PremiumSyncSchema] = []
        sync_rows = self.repo.list_by_user_id(user_id)
        for sync_row in sync_rows:
            premium_source = self.source_repo.get(sync_row.premium_source_id)
            if not premium_source:
                raise Exception("Premium source not found")

            rows = self.source_rows.count_rows(premium_source.id)

            synced_records = self.sync_log.count(sync_row.id, "synced")

            if rows == 0:
                progress = 100
            else:
                progress = min(
                    int((float(synced_records) / float(rows)) * 100), 100
                )

            if progress == 100:
                status = "synced"
            else:
                status = "syncing"

            sync_schema = PremiumSyncSchema(
                name=premium_source.name,
                created_at=sync_row.created_at,
                rows=rows,
                status=status,
                created_by="John Button",
                progress=progress,
                last_sync=datetime.now(timezone.utc),
                sync_platform="Google Ads",
                records_synced=synced_records,
            )

            sync_schemas.append(sync_schema)

        return sync_schemas

    def create_sync(
        self, premium_source_id: UUID, user_integration_id: int
    ) -> UUID:
        """
        Flushes, no commit
        """
        sync_id = self.repo.create_sync(
            premium_source_id=premium_source_id,
            user_integration_id=user_integration_id,
        )
        return sync_id

    def create_google_ads_sync_checked(
        self,
        user_id: int,
        premium_source_id: UUID,
        user_integration_id: int,
        request: CreateGoogleAdsPremiumSyncRequest,
    ):
        """
        Checks permissions and creates google ads premium sync
        Flushes, no commit
        """
        # TODO: add proper checks
        # allow only single sync, user_integration must exists, user integration must be google ads, premium source must be owned by user
        # user must be at least standard
        sync_id = self.create_sync_checked(
            user_id, premium_source_id, user_integration_id
        )
        logger.debug(f"created google ads premium sync with id {sync_id}")
        _google_sync_id = self.google_ads.create_sync(
            user_id=user_id,
            premium_source_sync_id=sync_id,
            customer_id=request.customer_id,
            list_id=request.list_id,
            list_name=request.list_name,
        )

    async def create_meta_sync_checked(
        self,
        user_id: int,
        premium_source_id: UUID,
        user_integration_id: int,
        request: CreateMetaPremiumSyncRequest,
    ):
        """
        Checks permissions and creates meta premium sync
        Flushes, no commit
        """
        sync_id = self.create_sync_checked(
            user_id, premium_source_id, user_integration_id
        )
        logger.info(f"created meta premium sync with id {sync_id}")
        _google_sync_id = await self.meta.create_sync(
            user_id=user_id,
            domain_id=None,
            campaign_id=request.campaign.campaign_id,
            campaign_name=request.campaign.campaign_name,
            premium_source_sync_id=sync_id,
            customer_id=request.customer_id,
            list_id=request.list_id,
            campaign_objective=None,
            bid_amount=str(request.campaign.bid_amount),
        )
