from typing import Tuple, Dict, List
from uuid import UUID

from clickhouse_connect.driver.common import StreamContext

from db_dependencies import Clickhouse, Db
from models import AudienceLookalikes
from persistence.enrichment_users import EnrichmentUsersPersistence
from resolver import injectable
from schemas.similar_audiences import NormalizationConfig
from services.lookalikes import AudienceLookalikesService
from services.similar_audiences import SimilarAudienceService
from services.similar_audiences.audience_profile_fetcher import ProfileFetcher
from services.similar_audiences.column_selector import AudienceColumnSelector
from services.similar_audiences.similar_audience_scores import SimilarAudiencesScoresService


@injectable
class LookalikeFillerService:
    def __init__(
        self,
        db: Db,
        clickhouse: Clickhouse,
        lookalikes: AudienceLookalikesService,
        audiences_scores: SimilarAudiencesScoresService,
        column_selector: AudienceColumnSelector,
        enrichment_users: EnrichmentUsersPersistence,
        similar_audience_service: SimilarAudienceService,
        profile_fetcher: ProfileFetcher
    ):
        self.db = db
        self.clickhouse = clickhouse
        self.lookalikes = lookalikes
        self.profile_fetcher = profile_fetcher
        self.audiences_scores = audiences_scores
        self.column_selector = column_selector
        self.enrichment_users = enrichment_users
        self.similar_audience_service = similar_audience_service

    def get_enrichment_users(
        self,
        significant_fields: Dict
    ) -> Tuple[StreamContext, List[str]]:
        """
            Returns a stream of blocks of enrichment users and a list of column names
        """

        column_names = self.column_selector.clickhouse_columns(significant_fields)

        columns = ", ".join(["asid"] + column_names)

        rows_stream = self.clickhouse.query_row_block_stream(
            f"SELECT {columns} FROM enrichment_users"
        )
        column_names = rows_stream.source.column_names

        return rows_stream, column_names

    def process_lookalike_pipeline(
        self,
        audience_lookalike: AudienceLookalikes
    ):
        sig = audience_lookalike.significant_fields or {}
        config = self.audiences_scores.get_config(sig)
        profiles = self.profile_fetcher.fetch_profiles_from_lookalike(audience_lookalike)

        model = self.train_and_save_model(lookalike_id=audience_lookalike.id, user_profiles=profiles, config=config)

        self.calculate_and_store_scores(
            model=model,
            lookalike_id=audience_lookalike.id,
        )

    def train_and_save_model(
        self,
        lookalike_id: UUID,
        user_profiles: List[Dict],
        config: NormalizationConfig,
    ):
        dict_enrichment = [
            {k: str(v) if v is not None else "None" for k, v in profile.items()}
            for profile in user_profiles
        ]
        trained = self.similar_audience_service.get_trained_model(dict_enrichment, config)
        model = trained[0] if isinstance(trained, (tuple, list)) else trained
        self.audiences_scores.save_enrichment_model(
            lookalike_id=lookalike_id,
            model=model
        )
        return model

    def calculate_and_store_scores(
        self,
        model,
        lookalike_id: UUID,
    ):
        lookalike = self.lookalikes.get_lookalike(lookalike_id)
        significant_fields = lookalike.significant_fields

        rows_stream, column_names = self.get_enrichment_users(
            significant_fields=significant_fields
        )

        with rows_stream:
            for batch in rows_stream:
                dict_batch = [dict(zip(column_names, row)) for row in batch]
                asids = [doc["asid"] for doc in dict_batch]
                enrichment_user_ids = self.enrichment_users.fetch_enrichment_user_ids(asids)

                self.audiences_scores.calculate_batch_scores(
                    model=model,
                    enrichment_user_ids=enrichment_user_ids,
                    lookalike_id=lookalike_id,
                    batch=dict_batch,
                )