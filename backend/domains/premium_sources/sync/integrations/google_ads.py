from uuid import UUID, uuid4
from venv import logger

from google.ads.googleads.errors import GoogleAdsException
from sqlalchemy import select
import asyncio
from db_dependencies import Db
from domains.premium_sources.sync.integrations.exceptions import (
    IntegrationNotFound,
    InvalidIntegration,
)
from domains.premium_sources.sync.persistence import (
    PremiumSourceSyncPersistence,
)
from domains.premium_sources.sync.config import (
    GOOGLE_BATCH_SIZE,
    SYNC_API_CONCURRENCY,
    RETRY_ATTEMPTS,
    RETRY_BACKOFF_BASE,
)
from domains.premium_sources.sync.utils import run_blocking
from domains.premium_sources.sync.schemas import UnprocessedPremiumSourceBatch
from models.integrations.users_domains_integrations import UserIntegration
from models.premium_source_syncs.google_ads import GoogleAdsPremiumSourceSync
from resolver import injectable
from services.integrations.google_ads import (
    GoogleAdsIntegrationsService,
    NewList,
)


@injectable
class GoogleAdsPremiumSourceSyncService:
    def __init__(
        self,
        db: Db,
        google_ads: GoogleAdsIntegrationsService,
        sync_repo: PremiumSourceSyncPersistence,
    ) -> None:
        self.db = db
        self.google_ads = google_ads
        self.sync_repo = sync_repo

    def fetch_sync_details(
        self, premium_source_sync_id: UUID
    ) -> GoogleAdsPremiumSourceSync | None:
        query = select(GoogleAdsPremiumSourceSync).where(
            GoogleAdsPremiumSourceSync.premium_source_sync_id
            == premium_source_sync_id
        )

        return self.db.execute(query).scalar()

    def create_sync(
        self,
        user_id: int,
        premium_source_sync_id: UUID,
        customer_id: str,
        list_id: str,
        list_name: str,
    ) -> UUID:
        """
        Creates a new Google Ads sync details and returns the id

        Flushes, no commit
        """

        if list_id == "-1":
            created_list = self.google_ads.try_create_list(
                list=NewList(customer_id=customer_id, name=list_name),
                domain_id=None,
                user_id=user_id,
            )
            list_id = created_list.list_id
            list_name = created_list.list_name

        new_id = uuid4()
        new_google_ads_sync = GoogleAdsPremiumSourceSync(
            id=new_id,
            premium_source_sync_id=premium_source_sync_id,
            customer_id=customer_id,
            list_id=list_id,
            list_name=list_name,
        )

        self.db.add(new_google_ads_sync)
        self.db.flush()

        return new_id

    def get_google_credentials(
        self, premium_source_sync_id: UUID, user_integration: UserIntegration
    ) -> tuple[str, str, str]:
        """
        Raises `InvalidIntegration`
        """
        if user_integration.service_name != "google_ads":
            raise InvalidIntegration()

        if user_integration.access_token is None:
            raise InvalidIntegration()

        google_sync_details = self.fetch_sync_details(premium_source_sync_id)

        if google_sync_details is None:
            raise InvalidIntegration()

        return (
            user_integration.access_token,
            google_sync_details.customer_id,
            google_sync_details.list_id,
        )

    async def sync_premium_source_batch(
        self, batch: UnprocessedPremiumSourceBatch
    ):
        """
        Raises `IntegrationNotFound`
        """
        user_integration = self.sync_repo.credentials_by_premium_sync_id(
            batch.premium_source_sync_id
        )
        if user_integration is None:
            raise IntegrationNotFound()

        access_token, customer_id, list_id = self.get_google_credentials(
            batch.premium_source_sync_id, user_integration
        )
        hashes = [row.sha256_email for row in batch.rows]

        sem = asyncio.Semaphore(SYNC_API_CONCURRENCY)

        async def send_chunk(chunk):
            async with sem:
                attempt = 0
                while True:
                    try:
                        # Если google_ads.add_users_to_list_hashed — sync, запустить в executor
                        return await run_blocking(
                            self.google_ads.add_users_to_list_hashed,
                            access_token,
                            chunk,
                            customer_id,
                            list_id,
                        )
                    except Exception as e:
                        attempt += 1
                        if attempt >= RETRY_ATTEMPTS:
                            logger.exception(
                                "Google chunk failed after retries"
                            )
                            raise
                        backoff = RETRY_BACKOFF_BASE * (2 ** (attempt - 1))
                        logger.warning(
                            f"Google chunk failed, retrying after {backoff}s (attempt {attempt})"
                        )
                        await asyncio.sleep(backoff)

        tasks = []
        for i in range(0, len(hashes), GOOGLE_BATCH_SIZE):
            chunk = hashes[i : i + GOOGLE_BATCH_SIZE]
            tasks.append(asyncio.create_task(send_chunk(chunk)))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for r in results:
            if isinstance(r, Exception):
                raise r

        logger.debug(
            f"sent {len(hashes)} hashed emails to google in {len(tasks)} chunks"
        )
