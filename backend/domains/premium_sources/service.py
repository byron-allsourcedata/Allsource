import logging
from uuid import UUID
from domains.aws.service import AwsService
from domains.premium_sources.downloads.token import DownloadToken
from domains.premium_sources.exceptions import (
    BadPremiumSourceUrl,
    PremiumSourceNotFound,
    PremiumSourceNotOwned,
)
from domains.premium_sources.premium_sources_rows.service import (
    PremiumSourcesRowsService,
)
from domains.premium_sources.schemas import (
    PremiumSourceDto,
    UserPremiumSourcesDto,
)
from domains.users.service import UsersService
from resolver import injectable

from .persistence import PremiumSourcePersistence

logger = logging.getLogger(__name__)


@injectable
class PremiumSourceService:
    def __init__(
        self,
        repo: PremiumSourcePersistence,
        premium_source_rows: PremiumSourcesRowsService,
        users: UsersService,
        aws: AwsService,
    ):
        self.repo = repo
        self.premium_source_rows = premium_source_rows
        self.users = users
        self.aws = aws

    def create(
        self,
        name: str,
        user_id: int,
        s3_url: str,
        rows: int,
        csv_rows: list[dict[str, str]],
    ) -> UUID:
        """
        Raises `MissingHashedEmailError`
        """
        source = self.repo.create(
            name=name, user_id=user_id, s3_url=s3_url, rows=rows
        )

        logger.debug(
            f"uploading premium source's {len(csv_rows)} rows to database"
        )
        self.premium_source_rows.process_csv(source.id, csv_rows)

        return source.id

    def delete(self, source_id: UUID):
        """
        Flushes
        """
        return self.repo.delete(source_id)

    def list(self, user_id: int) -> list[PremiumSourceDto]:
        return self.repo.list(user_id)

    def is_owned_by_user(self, user_id: int, source_id: UUID) -> bool:
        """
        Raises `PremiumSourceNotFound`
        """
        source = self.repo.get(source_id)

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

    def get_name_unchecked(self, source_id: UUID) -> str:
        """
        Does not check ownership

        Raises `PremiumSourceNotFound`
        """
        premium_source = self.repo.get(source_id)

        if premium_source is None:
            raise PremiumSourceNotFound()

        return premium_source.name

    def get_download_url(self, user_id: int, source_id: UUID) -> str:
        """
        Check user permissions and return download url for premium source

        Raises `PremiumSourceNotFound` \n
        Raises `PremiumSourceNotOwned` \n
        Raises `BadPremiumSourceUrl`
        """
        if not self.is_owned_by_user(user_id, source_id):
            raise PremiumSourceNotOwned()

        s3_file_token = self.s3_url_by_id(source_id)

        if s3_file_token is None or s3_file_token == "":
            raise BadPremiumSourceUrl()

        return self.aws.get_file_url(s3_file_token)

    def s3_url_by_id(self, source_id: UUID) -> str | None:
        premium_source = self.repo.get(source_id)

        if premium_source is None:
            raise PremiumSourceNotFound()

        return premium_source.s3_url

    def user_sources(self, user_id: int) -> UserPremiumSourcesDto:
        user_name = self.users.name_by_id(user_id)

        if user_name is None:
            user_name = "Unknown"

        return UserPremiumSourcesDto(
            user_name=user_name,
            premium_sources=self.repo.list(user_id),
        )
