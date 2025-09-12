from uuid import UUID, uuid4
from venv import logger

from sqlalchemy import select
from db_dependencies import Db
from domains.premium_sources.sync.integrations.exceptions import (
    IntegrationNotFound,
    InvalidIntegration,
)
from domains.premium_sources.sync.persistence import (
    PremiumSourceSyncPersistence,
)
from domains.premium_sources.sync.schemas import UnprocessedPremiumSourceBatch
from models.integrations.users_domains_integrations import UserIntegration
from models.premium_source_syncs.meta import MetaPremiumSourceSync
from resolver import injectable
from schemas.integrations.integrations import MetaCredentials
from services.integrations.meta import MetaIntegrationsService


@injectable
class MetaPremiumSourceSyncService:
    def __init__(
        self,
        db: Db,
        meta: MetaIntegrationsService,
        sync_repo: PremiumSourceSyncPersistence,
    ) -> None:
        self.db = db
        self.meta = meta
        self.sync_repo = sync_repo

    def fetch_sync_details(
        self, premium_source_sync_id: UUID
    ) -> MetaPremiumSourceSync | None:
        query = select(MetaPremiumSourceSync).where(
            MetaPremiumSourceSync.premium_source_sync_id
            == premium_source_sync_id
        )

        return self.db.execute(query).scalar()

    def create_premium_sync(
        self,
        user_id: int,
        premium_source_sync_id: UUID,
        campaign_id: str,
        customer_id: str,
        list_id: str,
        list_name: str,
    ) -> UUID:
        """
        Creates a new Meta sync details and returns the id

        Flushes, no commit
        """

        logger.info(f"creating meta premium source sync")
        new_id = uuid4()
        new_meta_ads_sync = MetaPremiumSourceSync(
            id=new_id,
            premium_source_sync_id=premium_source_sync_id,
            customer_id=customer_id,
            campaign_id=campaign_id,
            list_id=list_id,
            list_name=list_name,
        )

        self.db.add(new_meta_ads_sync)
        self.db.flush()

        return new_id

    async def create_sync(
        self,
        user_id: int,
        premium_source_sync_id: UUID,
        domain_id: int | None,
        customer_id: str,
        list_id: str,
        campaign_id: str,
        campaign_name: str,
        campaign_objective: str | None,
        bid_amount: str | None,
    ):
        """
        Raises `MetaError`
        """

        credentials = self.meta.get_credentials(
            user_id=user_id, domain_id=domain_id
        )

        logger.info(f"got creds for prem source")
        if not credentials:
            raise IntegrationNotFound()

        if campaign_id:
            logger.info(f"creating adset")

            self.meta.create_adset(
                ad_account_id=customer_id,
                campaign_id=campaign_id,
                access_token=credentials.access_token,
                list_id=list_id,
                campaign_objective=campaign_objective,
                campaign_name=campaign_name,
                bid_amount=bid_amount,
            )

        logger.info(f"creating premium sync")
        _ = self.create_premium_sync(
            user_id=user_id,
            campaign_id=campaign_id,
            premium_source_sync_id=premium_source_sync_id,
            customer_id=customer_id,
            list_id=list_id,
            list_name=list_id,
        )

    def get_meta_credentials(
        self, premium_source_sync_id: UUID, user_integration: UserIntegration
    ) -> tuple[str, str, str]:
        """
        Raises `InvalidIntegration`
        """
        if user_integration.service_name != "meta":
            raise InvalidIntegration()

        if user_integration.access_token is None:
            raise InvalidIntegration()

        meta_sync_details = self.fetch_sync_details(premium_source_sync_id)

        if meta_sync_details is None:
            raise InvalidIntegration()

        return (
            user_integration.access_token,
            meta_sync_details.customer_id,
            meta_sync_details.list_id,
        )

    def sync_premium_source_batch(self, batch: UnprocessedPremiumSourceBatch):
        """
        Raises `IntegrationNotFound`
        """
        user_integration = self.sync_repo.credentials_by_premium_sync_id(
            batch.premium_source_sync_id
        )
        if user_integration is None:
            raise IntegrationNotFound()

        access_token, customer_id, list_id = self.get_meta_credentials(
            batch.premium_source_sync_id, user_integration
        )

        hashes = [row.sha256_email for row in batch.rows]

        try:
            hashed_emails_result = self.meta.add_hashed_emails_to_list(
                access_token, list_id, hashes
            )

            logger.debug(f"sent hashed emails to meta: {hashed_emails_result}")
        except Exception as e:
            logger.error(e)
