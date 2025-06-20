import logging
import statistics
import time
from typing import Tuple, Dict, List, TypedDict
from uuid import UUID

from clickhouse_connect.driver.common import StreamContext
from sqlalchemy import update
from typing_extensions import deprecated

from db_dependencies import Clickhouse, Db, ClickhouseInserter
from models import AudienceLookalikes
from persistence.audience_lookalikes import AudienceLookalikesPersistence
from persistence.audience_sources_matched_persons import (
    AudienceSourcesMatchedPersonsPersistence,
)
from persistence.enrichment_lookalike_scores import (
    EnrichmentLookalikeScoresPersistence,
)
from persistence.enrichment_users import EnrichmentUsersPersistence
from resolver import injectable
from schemas.similar_audiences import NormalizationConfig
from services.lookalike_filler.rabbitmq import RabbitFillerService
from services.lookalikes import AudienceLookalikesService
from services.similar_audiences import SimilarAudienceService
from services.similar_audiences.audience_profile_fetcher import ProfileFetcher
from services.similar_audiences.column_selector import AudienceColumnSelector
from services.similar_audiences.similar_audience_scores import (
    SimilarAudiencesScoresService,
    measure,
)

logger = logging.getLogger(__name__)


class SimilarityStats(TypedDict):
    min: float | None
    max: float | None
    average: float | None
    median: float | None


@injectable
class LookalikeFillerService:
    def __init__(
        self,
        db: Db,
        clickhouse: Clickhouse,
        clickhouse_inserter: ClickhouseInserter,
        lookalikes: AudienceLookalikesService,
        audiences_scores: SimilarAudiencesScoresService,
        column_selector: AudienceColumnSelector,
        similar_audience_service: SimilarAudienceService,
        profile_fetcher: ProfileFetcher,
        enrichment_users: EnrichmentUsersPersistence,
        enrichment_scores: EnrichmentLookalikeScoresPersistence,
        audience_lookalikes: AudienceLookalikesPersistence,
        matched_sources: AudienceSourcesMatchedPersonsPersistence,
        rabbit: RabbitFillerService,
    ):
        self.db = db
        self.clickhouse = clickhouse
        self.clickhouse_inserter = clickhouse_inserter
        self.lookalikes = lookalikes
        self.profile_fetcher = profile_fetcher
        self.audiences_scores = audiences_scores
        self.column_selector = column_selector
        self.similar_audience_service = similar_audience_service
        self.enrichment_users = enrichment_users
        self.enrichment_scores = enrichment_scores
        self.audience_lookalikes = audience_lookalikes
        self.matched_sources = matched_sources
        self.rabbit = rabbit

    def get_enrichment_users(
        self, significant_fields: Dict
    ) -> Tuple[StreamContext, List[str]]:
        """
        Returns a stream of blocks of enrichment users and a list of column names
        """

        column_names = self.column_selector.clickhouse_columns(
            significant_fields
        )

        columns = ", ".join(["asid"] + column_names)

        rows_stream = self.clickhouse.query_row_block_stream(
            f"SELECT {columns} FROM enrichment_users"
        )
        column_names = rows_stream.source.column_names

        return rows_stream, column_names

    def get_lookalike(self, lookalike_id: UUID) -> AudienceLookalikes | None:
        return self.lookalikes.get_lookalike(lookalike_id)

    def process_lookalike_pipeline(
        self, audience_lookalike: AudienceLookalikes
    ):
        sig = audience_lookalike.significant_fields or {}
        config = self.audiences_scores.get_config(sig)
        profiles = self.profile_fetcher.fetch_profiles_from_lookalike(
            audience_lookalike
        )

        logger.info(f"fetched profiles: {len(profiles)}")

        model = self.train_and_save_model(
            lookalike_id=audience_lookalike.id,
            user_profiles=profiles,
            config=config,
        )

        self.calculate_and_store_scores(
            model=model,
            lookalike_id=audience_lookalike.id,
        )

        top_asids, scores = self.post_process_lookalike(audience_lookalike)

        user_ids = self.enrichment_users.fetch_enrichment_user_ids(top_asids)

        return user_ids

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
        trained = self.similar_audience_service.get_trained_model(
            dict_enrichment, config
        )
        model = trained[0] if isinstance(trained, (tuple, list)) else trained
        self.audiences_scores.save_enrichment_model(
            lookalike_id=lookalike_id, model=model
        )
        return model

    def calculate_and_store_scores(
        self,
        model,
        lookalike_id: UUID,
    ):
        lookalike = self.lookalikes.get_lookalike(lookalike_id)
        significant_fields = lookalike.significant_fields
        value_by_asid: dict[UUID, float] = {
            asid: float(val)
            for val, asid in self.profile_fetcher.get_value_and_user_asids(
                self.db, lookalike.source_uuid
            )
        }
        users_count = self.enrichment_users.count()

        self.lookalikes.update_dataset_size(
            lookalike_id=lookalike_id, dataset_size=users_count
        )

        rows_stream, column_names = self.get_enrichment_users(
            significant_fields=significant_fields
        )

        count = 0
        batch_buffer = []

        with rows_stream:
            fetch_start = time.perf_counter()
            for batch in rows_stream:
                dict_batch = [
                    {
                        **dict(zip(column_names, row)),
                        "customer_value": value_by_asid.get(
                            row[column_names.index("asid")], 0.0
                        ),
                    }
                    for row in batch
                ]

                batch_buffer.extend(dict_batch)

                if len(batch_buffer) < 1_000_000:
                    continue
                fetch_end = time.perf_counter()
                logger.info(f"fetch time: {fetch_end - fetch_start:.3f}")


                asids = [doc["asid"] for doc in batch_buffer]

                times, duration = measure(
                    lambda _: self.audiences_scores.calculate_batch_scores(
                        model=model,
                        asids=asids,
                        lookalike_id=lookalike_id,
                        batch=batch_buffer,
                    )
                )

                calc, inserts = times
                logger.info(f"batch calculation time: {calc:.3f}")
                logger.info(f"batch insert time: {inserts:.3f}")

                count += len(asids)
                _, duration = measure(
                    lambda _: (
                        self.db.execute(
                            update(AudienceLookalikes)
                            .where(AudienceLookalikes.id == lookalike_id)
                            .values(processed_train_model_size=count)
                        ),
                        self.db.commit(),
                    )
                )


                logger.info(f"lookalike update time: {duration:.3f}")
                logger.info(f"processed users = {count}")
                batch_buffer = []

                total_batch_time = time.perf_counter() - fetch_start
                logger.info(f"total batch time: {total_batch_time:.3f}")
                fetch_start = time.perf_counter()

        self.db_workaround(lookalike_id=lookalike_id)

    @deprecated("workaround")
    def db_workaround(self, lookalike_id: UUID):
        """
        Forcefully set processed_size equal to size because of data inconsistency
        between Postgres and ClickHouse — we assume the full batch is received.
        """

        self.db.execute(
            update(AudienceLookalikes)
            .where(AudienceLookalikes.id == lookalike_id)
            .values(
                train_model_size=AudienceLookalikes.processed_train_model_size
            )
        )

    def post_process_lookalike(self, audience_lookalike: AudienceLookalikes):
        source_id = audience_lookalike.source_uuid
        lookalike_id = audience_lookalike.id
        total_rows = self.audience_lookalikes.get_max_size(
            audience_lookalike.lookalike_size
        )

        source_asids = self.matched_sources.matched_asids_for_source(
            source_id=source_id
        )

        enrichment_lookalike_scores = self.enrichment_scores.select_top(
            lookalike_id=lookalike_id,
            source_asids=source_asids,
            top_count=total_rows,
        )

        n_scores = len(enrichment_lookalike_scores)
        logging.info(f"Total row in pixel file: {n_scores}")

        asids = [s["asid"] for s in enrichment_lookalike_scores]
        scores = self.preprocess_scores(enrichment_lookalike_scores)

        audience_lookalike.size = n_scores
        audience_lookalike.similarity_score = self.calculate_similarity_stats(
            scores
        )
        self.db.add(audience_lookalike)
        self.db.flush()

        logger.info(f"asid len: {len(asids)}")

        return asids, scores

    def preprocess_scores(self, lookalike_scores: list) -> list[float]:
        return [
            float(s["score"])
            for s in lookalike_scores
            if s["score"] is not None
        ]

    def calculate_similarity_stats(
        self, scores: list[float]
    ) -> SimilarityStats:
        if scores:
            return {
                "min": round(min(scores), 3),
                "max": round(max(scores), 3),
                "average": round(sum(scores) / len(scores), 3),
                "median": round(statistics.median(scores), 3),
            }

        return {
            "min": None,
            "max": None,
            "average": None,
            "median": None,
        }

    async def inform_lookalike_agent(
        self, channel, lookalike_id: UUID, user_id: int, persons: list[UUID]
    ):
        await self.rabbit.inform_lookalike_agent(
            channel=channel,
            lookalike_id=lookalike_id,
            user_id=user_id,
            persons=persons,
        )
