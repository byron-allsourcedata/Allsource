from itertools import batched
import logging
from uuid import UUID
from db_dependencies import Clickhouse
from resolver import injectable

logger = logging.getLogger(__name__)


class MissingHashedEmailError(Exception):
    pass


@injectable
class PremiumSourcesRowsService:
    def __init__(self, clickhouse: Clickhouse) -> None:
        self.clickhouse = clickhouse

    def process_csv(
        self, premium_source_id: UUID, csv_content: list[dict[str, str]]
    ) -> int:
        """
        Raises MissingHashedEmailError
        """

        if not csv_content:
            return 0

        hashed_column = self.get_hashed_email_column_name(csv_content[0])

        emails = [
            row[hashed_column] for row in csv_content[1:] if row[hashed_column]
        ]

        for email in emails:
            if not email:
                raise MissingHashedEmailError(
                    "CSV must contain 'sha256_email' column"
                )

        return self.upload_emails(premium_source_id, emails)

    def get_hashed_email_column_name(self, row: dict[str, str]) -> str:
        candidates = [
            "personal_email_sha256",
            "email_sha256",
            "sha256_email",
            "business_email_sha256",
        ]

        for candidate in candidates:
            if candidate in row:
                return candidate

        raise MissingHashedEmailError("CSV must contain 'sha256_email' column")

    def upload_emails(
        self, premium_source_id: UUID, sha256_emails: list[str]
    ) -> int:
        # row_id must start from 1, because 0 is magic value in clickhouse join
        CHUNK_SIZE = 1_000_000
        row_offset = 1

        for chunk in batched(sha256_emails, CHUNK_SIZE):
            rows = [
                (str(premium_source_id), row_offset + i, email)
                for i, email in enumerate(chunk)
            ]
            if rows:
                logger.info(f"inserting {len(rows)} rows into clickhouse")
                _ = self.clickhouse.insert(
                    "premium_sources_rows",
                    rows,
                    column_names=[
                        "premium_source_id",
                        "row_id",
                        "sha256_email",
                    ],
                )
            row_offset += len(chunk)

        return row_offset

    def count_rows(self, premium_source_id: UUID) -> int:
        query = self.clickhouse.query(
            "SELECT COUNT(*) as count FROM premium_sources_rows WHERE premium_source_id = %(premium_source_id)s",
            parameters={"premium_source_id": str(premium_source_id)},
        )

        rows = list(query.named_results())

        if len(rows) == 0:
            raise Exception("Premium source not found")

        return rows[0]["count"]
