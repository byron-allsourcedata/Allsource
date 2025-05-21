from typing import List, Dict, Optional
from uuid import UUID

from config import ClickhouseConfig
from dependencies import Clickhouse, Db
from enums import BusinessType
from models import AudienceSourcesMatchedPerson, EnrichmentUser
from persistence.audience_lookalikes import AudienceLookalikesPostgresPersistence
from resolver import injectable
from schemas.similar_audiences import AudienceFeatureImportance


@injectable
class ClickhousePersistence:
    def __init__(self, db: Db, client: Clickhouse, postgres: AudienceLookalikesPostgresPersistence):
        self.db = db
        self.client = client
        self.postgres = postgres

    def calculate_lookalikes(self, user_id: int, source_uuid: UUID, lookalike_size: str) -> List[Dict]:
        return self.postgres.calculate_lookalikes(user_id, source_uuid, lookalike_size)

    def retrieve_source_insights(
        self,
        source_uuid: UUID,
        audience_type: BusinessType,
        limit: Optional[int] = None,
    ) -> List[Dict]:
        q = (
            self.db.query(EnrichmentUser.asid)
            .select_from(AudienceSourcesMatchedPerson)
            .join(
                EnrichmentUser,
                AudienceSourcesMatchedPerson.enrichment_user_id == EnrichmentUser.id
            )
            .filter(AudienceSourcesMatchedPerson.source_id == str(source_uuid))
        )

        # TODO: Add hard limit to number of rows
        if limit is not None:
            q = q.limit(limit)

        rows = q.all()

        b2c_columns = [
            "age",
            "gender",
            "homeowner",
            "length_of_residence_years",
            "marital_status",
            "business_owner",
            "birth_day",
            "birth_month",
            "birth_year",
            "has_children",
            "number_of_children",
            "religion",
            "ethnicity",
            "language_code",
            "state_abbr",
            "zip_code5",
            "income_range",
            "net_worth",
            "credit_rating",
            "credit_cards",
            "bank_card",
            "credit_card_premium",
            "credit_card_new_issue",
            "credit_lines",
            "credit_range_of_new_credit_lines",
            "donor",
            "investor",
            "mail_order_donor",
            "pets",
            "cooking_enthusiast",
            "travel",
            "mail_order_buyer",
            "online_purchaser",
            "book_reader",
            "health_and_beauty",
            "fitness",
            "outdoor_enthusiast",
            "tech_enthusiast",
            "diy",
            "gardening",
            "automotive_buff",
            "golf_enthusiast",
            "beauty_cosmetics",
            "smoker",
            "party_affiliation",
            "voting_propensity",
            "congressional_district",
        ]

        b2b_columns = [
            "company_size",
            "primary_industry",
            "job_duration",
            "annual_sales",
            "job_start_date",
            "current_company_name",
            "current_job_title",
            "job_location",
            "job_level",
            "department",
        ]

        if audience_type == BusinessType.B2C:
            enrichment_columns = b2c_columns
        elif audience_type == BusinessType.B2B:
            enrichment_columns = b2b_columns
        else:
            enrichment_columns = b2c_columns + b2b_columns

        asids = [row[0] for row in rows]


        columns = ", ".join(enrichment_columns)
        client = ClickhouseConfig.get_client()
        result = client.query(
            f"SELECT {columns} FROM {ClickhouseConfig.users_table()} WHERE asid IN %(ids)s",
            parameters={
                "ids": asids
            }
        )

        names: list[str] = result.column_names
        rows = [dict(zip(names, vals)) for vals in result.result_set]
        return rows

    def get_processing_lookalike(self, id: UUID):
        return self.postgres.get_processing_lookalike(id)

    def get_all_sources(self, user_id):
        return self.postgres.get_all_sources(user_id)

    def search_lookalikes(self, start_letter, user_id):
        return self.postgres.search_lookalikes(start_letter, user_id)

    def update_lookalike(self, uuid_of_lookalike, name_of_lookalike, user_id):
        return self.postgres.update_lookalike(uuid_of_lookalike, name_of_lookalike, user_id)

    def delete_lookalike(self, uuid_of_lookalike, user_id):
        return self.postgres.delete_lookalike(uuid_of_lookalike, user_id)

    def create_lookalike(
        self,
        uuid_of_source,
        user_id,
        lookalike_size,
        lookalike_name,
        created_by_user_id,
        audience_feature_importance: AudienceFeatureImportance
    ):
        return self.postgres.create_lookalike(
            uuid_of_source,
            user_id,
            lookalike_size,
            lookalike_name,
            created_by_user_id,
            audience_feature_importance
        )
