from decimal import Decimal
from typing import (
    List,
    Dict,
    Tuple
)
from uuid import UUID

from clickhouse_connect.driver.query import QueryResult
from sqlalchemy import select
from sqlalchemy.orm import Session

from db_dependencies import Db, Clickhouse
from models import (
    AudienceLookalikes,
    AudienceSourcesMatchedPerson,
    EnrichmentUser,
    AudienceSource
)
from resolver import injectable
from services.similar_audiences.audience_profile_fetcher.interface import ProfileFetcherInterface
from services.similar_audiences.column_selector import AudienceColumnSelector

@injectable
class ClickhouseProfileFetcher(ProfileFetcherInterface):
    def __init__(
        self,
        db: Db,
        clickhouse: Clickhouse,
        column_selector: AudienceColumnSelector
    ):
        self.db = db
        self.clickhouse = clickhouse
        self.column_selector = column_selector


    def fetch_profiles(
        self,
        selected_columns: List[str],
        asids: List[UUID]
    ) -> List[dict]:
        columns = ", ".join(selected_columns)
        self.clickhouse.command("SET max_query_size = 10485760")

        query = f"SELECT {columns} FROM enrichment_users WHERE asid IN %(asids)s"
        result = self.clickhouse.query(
            query, parameters={
                "asids": asids
            }
        )

        result = self.parse_clickhouse_result(result)

        def pad_with_zeros(zip_code: int) -> str:
            return str(zip_code).zfill(5)

        result = [{**row, "zip_code5": pad_with_zeros(row['zip_code5']) if 'zip_code5' in row else "00000"}for row in result]

        return result


    def fetch_profiles_from_lookalike(self, audience_lookalike: AudienceLookalikes) -> List[dict]:
        column_names = self.column_selector.clickhouse_columns(audience_lookalike.significant_fields)

        users = self.get_value_and_user_asids(self.db, audience_lookalike.source_uuid)

        customer_values = [customer[0] for customer in users]
        asids = [user[1] for user in users]


        profiles = self.fetch_profiles(column_names, asids)

        profiles = [{**profile, "customer_value": customer_value} for customer_value, profile in zip(customer_values, profiles)]

        return profiles

    def parse_clickhouse_result(
        self,
        clickhouse_result: QueryResult
    ) -> List[dict]:
        column_names = clickhouse_result.column_names
        rows = clickhouse_result.result_rows
        return [dict(zip(column_names, row)) for row in rows]

    def fetch_clickhouse_user_profiles(
        self,
        db: Session,
        clickhouse: Clickhouse,
        audience_lookalike: AudienceLookalikes,
        column_selector: AudienceColumnSelector
    ) -> List[Dict]:
        select_cols = column_selector.cols(
            audience_lookalike
        )

        asids = self.get_value_and_user_asids(db, audience_lookalike.source_uuid)

        columns = ", ".join(select_cols)
        query = f"SELECT {columns} FROM enrichment_users WHERE asid IN %(asids)s"
        result = clickhouse.query(
            query, parameters={
                "asids": asids
            }
        )

        return self.parse_clickhouse_result(result)


    def get_value_and_user_asids(
        self,
        db: Session,
        source_id: UUID
    ) -> List[Tuple[Decimal, UUID]]:
        query = (
            select(
                AudienceSourcesMatchedPerson.value_score.label("customer_value"),
                EnrichmentUser.asid
            )
            .select_from(AudienceSource)
            .join(
                AudienceSourcesMatchedPerson,
                AudienceSourcesMatchedPerson.source_id == AudienceSource.id
            )
            .join(
                EnrichmentUser,
                EnrichmentUser.id == AudienceSourcesMatchedPerson.enrichment_user_id
            )
            .where(AudienceSource.id == source_id)
        )

        return [(row[0], row[1]) for row in db.execute(query).all()]

