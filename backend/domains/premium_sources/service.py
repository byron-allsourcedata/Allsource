import logging
from uuid import UUID
from domains.aws.service import AwsService
from domains.premium_sources.downloads.token import DownloadToken
from domains.premium_sources.exceptions import (
    BadPremiumSourceUrl,
    PremiumSourceNotFound,
    PremiumSourceNotOwned,
)
from domains.premium_sources.premium_sources_payments.service import (
    PremiumSourcesPaymentsService,
)
from domains.premium_sources.premium_sources_rows.service import (
    PremiumSourcesRowsService,
)
from domains.premium_sources.schemas import (
    BasePremiumSourceDto,
    PremiumSourceDto,
    PremiumSourceStatus,
    UserPremiumSourcesDto,
)
from domains.premium_sources.sync.service import PremiumSourceSyncService
from domains.premium_sources.sync_log.persistence import (
    PremiumSourceSyncLogPersistence,
)
from domains.premium_sources.table.service import PremiumSourceTableService
from domains.users.service import UsersService
from resolver import injectable


logger = logging.getLogger(__name__)


@injectable
class PremiumSourceService:
    def __init__(
        self,
        sources: PremiumSourceTableService,
        premium_source_rows: PremiumSourcesRowsService,
        payments: PremiumSourcesPaymentsService,
        users: UsersService,
        syncs: PremiumSourceSyncService,
        sync_logs: PremiumSourceSyncLogPersistence,
        aws: AwsService,
    ):
        self.sources = sources
        self.payments = payments
        self.premium_source_rows = premium_source_rows
        self.users = users
        self.aws = aws
        self.syncs = syncs
        self.sync_logs = sync_logs

    def create(
        self,
        name: str,
        price: int,
        user_id: int,
        s3_url: str,
        rows: int,
        csv_rows: list[dict[str, str]],
    ) -> UUID:
        return self.sources.create(
            name=name,
            price=price,
            user_id=user_id,
            s3_url=s3_url,
            rows=rows,
            csv_rows=csv_rows,
        )

    def delete(self, source_id: UUID):
        """
        Flushes
        """
        return self.sources.delete(source_id)

    def list(self, user_id: int) -> list[PremiumSourceDto]:
        base_dtos = self.sources.repo.list(user_id)

        result: list[PremiumSourceDto] = []
        for base_dto in base_dtos:
            result.append(
                PremiumSourceDto(
                    status=self._get_premium_source_status(base_dto),
                    id=base_dto.id,
                    name=base_dto.name,
                    price=base_dto.price,
                    user_id=base_dto.user_id,
                    rows=base_dto.rows,
                    created_at=base_dto.created_at,
                    source_type=base_dto.source_type,
                )
            )

        return result

    def _get_premium_source_status(
        self, row: BasePremiumSourceDto
    ) -> PremiumSourceStatus:
        """
        This is an inefficient method for getting premium source status

        When it will cause performance issues, it should be replaced with a single optimized query

        Do NOT use it outside of this class
        """
        result_syncs = self.syncs.by_source_id(row.id)

        logger.debug(f"result_syncs: {len(result_syncs)}")

        if not result_syncs:
            if row.price > 0:
                is_paid = self.payments.is_premium_source_paid(row.id)
                if not is_paid:
                    return "locked"
            return "ready"
        else:
            synced_count = self.sync_logs.count(result_syncs[0].id, "synced")

            if synced_count == row.rows:
                return "synced"
            else:
                return "syncing"

    def is_owned_by_user(self, user_id: int, source_id: UUID) -> bool:
        """
        Raises `PremiumSourceNotFound`
        """
        source = self.sources.repo.get(source_id)

        if source is None:
            raise PremiumSourceNotFound()

        return source.user_id == user_id

    def get_download_token(self, user_id: int, source_id: UUID) -> str:
        """
        Check user permissions and return download token for premium source

        Raises `PremiumSourceNotFound` \n
        Raises `PremiumSourceNotOwned`
        """
        if not self.is_owned_by_user(user_id, source_id):
            raise PremiumSourceNotOwned()

        return DownloadToken(
            user_id=user_id, premium_source_id=source_id
        ).encode()

    def get_download_url(self, user_id: int, source_id: UUID) -> str:
        """
        Check user permissions and return download url for premium source

        Raises `PremiumSourceNotFound` \n
        Raises `PremiumSourceNotOwned` \n
        Raises `BadPremiumSourceUrl`
        """
        if not self.is_owned_by_user(user_id, source_id):
            raise PremiumSourceNotOwned()

        s3_file_token = self.sources.s3_url_by_id(source_id)

        if s3_file_token is None or s3_file_token == "":
            raise BadPremiumSourceUrl()

        return self.aws.get_file_url(s3_file_token)

    def user_sources(self, user_id: int) -> UserPremiumSourcesDto:
        user_name = self.users.name_by_id(user_id)

        if user_name is None:
            user_name = "Unknown"

        return UserPremiumSourcesDto(
            user_name=user_name,
            premium_sources=self.list(user_id),
        )
