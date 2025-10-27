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
    ) -> tuple[int, str]:
        """
        Raises MissingHashedEmailError
        """

        if not csv_content:
            return 0

        key_column = self.get_identifier_column_name(csv_content[0])

        identifiers = [
            row[key_column].strip()
            for row in csv_content
            if row.get(key_column)
        ]

        if not identifiers:
            raise MissingHashedEmailError(
                f"CSV must contain at least one valid value in '{key_column}'"
            )

        uploaded_rows = self.upload_identifiers(
            premium_source_id, identifiers, key_column
        )

        source_type = "asid" if "asid" in key_column else "email"

        return uploaded_rows, source_type

    def get_identifier_column_name(self, row: dict[str, str]) -> str:
        """
        Determine which field to load: email hash or asid
        """
        email_candidates = [
            "personal_email_sha256",
            "email_sha256",
            "sha256_email",
            "business_email_sha256",
        ]

        asid_candidates = ["asid", "as_id"]

        for candidate in email_candidates:
            if candidate in row:
                return candidate

        for candidate in asid_candidates:
            if candidate in row:
                return candidate

        raise MissingHashedEmailError(
            "CSV must contain one of: sha256_email or asid"
        )

    def upload_identifiers(
        self, premium_source_id: UUID, identifiers: list[str], column_name: str
    ) -> int:
        CHUNK_SIZE = 1_000_000
        row_offset = 1

        if "asid" in column_name:
            ch_column = "asid"
        else:
            ch_column = "sha256_email"

        for chunk in batched(identifiers, CHUNK_SIZE):
            rows = [
                (str(premium_source_id), row_offset + i, identifier)
                for i, identifier in enumerate(chunk)
            ]

            if rows:
                logger.info(
                    f"Inserting {len(rows)} rows ({ch_column}) into clickhouse"
                )
                _ = self.clickhouse.insert(
                    "premium_sources_rows",
                    rows,
                    column_names=[
                        "premium_source_id",
                        "row_id",
                        ch_column,
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
