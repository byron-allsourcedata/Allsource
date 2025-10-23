import hashlib
from itertools import batched
import logging
from uuid import UUID
from db_dependencies import Clickhouse
from persistence.enrichment_users import EnrichmentUsersPersistence
from resolver import injectable

logger = logging.getLogger(__name__)


class MissingHashedEmailError(Exception):
    pass


@injectable
class PremiumSourcesRowsService:
    def __init__(
        self, clickhouse: Clickhouse, users_repo: EnrichmentUsersPersistence
    ) -> None:
        self.clickhouse = clickhouse
        self.users_repo = users_repo

    def process_csv(
        self, premium_source_id: UUID, csv_content: list[dict[str, str]]
    ) -> tuple[int, str]:
        if not csv_content:
            logger.error("CSV content is empty")
            return 0, "unknown"

        key_column = self.get_identifier_column_name(csv_content[0])

        identifiers = []

        for row in csv_content:
            value = row.get(key_column)
            if not value:
                continue

            value = value.strip().strip("{}")

            if not value:
                continue

            identifiers.append(value)

        if not identifiers:
            raise MissingHashedEmailError(
                f"CSV must contain at least one valid value in '{key_column}'"
            )

        if "asid" in key_column:
            uploaded_rows = self.upload_asid_with_email(
                premium_source_id, identifiers
            )
            source_type = "asid"
        else:
            uploaded_rows = self.upload_identifiers(
                premium_source_id, identifiers, key_column
            )
            source_type = "email"

        return uploaded_rows, source_type

    def get_identifier_column_name(self, row: dict[str, str]) -> str:
        email_candidates = [
            "personal_email_sha256",
            "email_sha256",
            "sha256_email",
            "business_email_sha256",
        ]
        asid_candidates = ["asid", "as_id"]
        lower_row_keys = {k.lower(): k for k in row.keys()}

        for candidate in email_candidates:
            if candidate in lower_row_keys:
                return lower_row_keys[candidate]

        for candidate in asid_candidates:
            if candidate in lower_row_keys:
                return lower_row_keys[candidate]

        raise MissingHashedEmailError(
            "CSV must contain one of: sha256_email or asid"
        )

    def upload_asid_with_email(
        self, premium_source_id: UUID, asids: list[str]
    ) -> int:
        CHUNK_SIZE = 5000
        row_offset = 1

        for chunk in batched(asids, CHUNK_SIZE):
            users = self.users_repo.get_emails_by_asids(list(chunk))

            rows = []
            for asid, email in users.items():
                sha256_email = None
                if email:
                    sha256_email = hashlib.sha256(
                        email.strip().lower().encode()
                    ).hexdigest()
                rows.append(
                    (str(premium_source_id), row_offset, asid, sha256_email)
                )
                row_offset += 1

            if rows:
                logger.info(
                    f"Inserting {len(rows)} ASID→email rows into ClickHouse"
                )
                self.clickhouse.insert(
                    "premium_sources_rows",
                    rows,
                    column_names=[
                        "premium_source_id",
                        "row_id",
                        "asid",
                        "sha256_email",
                    ],
                )

        return row_offset

    def upload_identifiers(
        self, premium_source_id: UUID, identifiers: list[str], column_name: str
    ) -> int:
        CHUNK_SIZE = 1_000_000
        row_offset = 1

        if "asid" in column_name.lower():
            ch_column = "asid"
        else:
            ch_column = "sha256_email"

        for chunk in batched(identifiers, CHUNK_SIZE):
            rows = [
                (str(premium_source_id), row_offset + i, identifier)
                for i, identifier in enumerate(chunk)
            ]
            if rows:
                self.clickhouse.insert(
                    "premium_sources_rows",
                    rows,
                    column_names=["premium_source_id", "row_id", ch_column],
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
