import logging
from uuid import UUID
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
    ):
        self.repo = repo
        self.premium_source_rows = premium_source_rows
        self.users = users

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

    def user_sources(self, user_id: int) -> UserPremiumSourcesDto:
        user_name = self.users.name_by_id(user_id)

        if user_name is None:
            user_name = "Unknown"

        return UserPremiumSourcesDto(
            user_name=user_name,
            premium_sources=self.repo.list(user_id),
        )
