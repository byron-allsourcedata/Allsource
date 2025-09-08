import logging
import statistics
import time
from typing import Tuple, Dict, List, TypedDict
from typing_extensions import deprecated

from concurrent.futures import Future, ProcessPoolExecutor, as_completed

from uuid import UUID
from clickhouse_connect.driver.common import StreamContext
from catboost import CatBoostRegressor
from sqlalchemy import update

from db_dependencies import Clickhouse, Db, ClickhouseInserter, get_db
from resolver import injectable

from config.clickhouse import ClickhouseConfig
from config.util import get_int_env

from models import AudienceLookalikes

from persistence.audience_lookalikes import AudienceLookalikesPersistence
from persistence.audience_sources_matched_persons import (
    AudienceSourcesMatchedPersonsPersistence,
)
from persistence.enrichment_lookalike_scores import (
    EnrichmentLookalikeScoresPersistence,
)
from persistence.enrichment_users import EnrichmentUsersPersistence
from schemas.similar_audiences import NormalizationConfig
from services.lookalikes.lookalike_filler.rabbitmq import RabbitLookalikesMatchingService
from services.lookalikes.lookalike_filler.worker import filler_worker
from services.lookalikes import AudienceLookalikesService
from services.similar_audiences.similar_audiences import SimilarAudienceService
from services.similar_audiences.audience_profile_fetcher import ProfileFetcher
from services.similar_audiences.column_selector import AudienceColumnSelector
from services.similar_audiences.similar_audience_scores import (
    PersonScore,
    SimilarAudiencesScoresService,
)

logger = logging.getLogger(__name__)


class SimilarityStats(TypedDict):
    min: float | None
    max: float | None
    average: float | None
    median: float | None


class LookalikeFillerServiceBase:
    """
    The most important method - process_lookalike_pipeline

    It does not use @injectable annotation because of python's multiprocessing and pickling restrictions
    """

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
        rabbit: RabbitLookalikesMatchingService,
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

    def get_buckets(self, num_workers: int):
        buckets_per_worker = 100 // num_workers
        bucket_ranges = [
            list(range(i * buckets_per_worker, (i + 1) * buckets_per_worker))
            for i in range(num_workers)
        ]

        return bucket_ranges

    def get_enrichment_users(
        self, significant_fields: dict[str, str]
    ) -> tuple[StreamContext, list[str]]:
        """
        Returns a stream of blocks of enrichment users and a list of column names
        """

        column_names = self.column_selector.clickhouse_columns(
            significant_fields
        )

        columns = ", ".join(["asid"] + column_names)

        rows_stream = self.clickhouse.query_row_block_stream(
            f"SELECT {columns} FROM enrichment_users",
            settings={"max_block_size": 1000000},
        )
        column_names = rows_stream.source.column_names

        return rows_stream, column_names

    def get_enrichment_users_partition(
        self,
        significant_fields: dict,
        bucket: list[int],
        limit: int | None = None,
    ) -> tuple[StreamContext, list[str]]:
        """
        Returns a stream of blocks of enrichment users and a list of column names for a partition
        """

        column_names = self.column_selector.clickhouse_columns(
            significant_fields
        )

        columns = ", ".join(["asid"] + column_names)

        logger.info(f"bucket: {bucket}")

        in_clause = ",".join(f"{x}" for x in bucket)

        client = ClickhouseConfig.get_client()

        limit_clause = f" LIMIT {limit}" if limit else ""

        rows_stream = client.query_row_block_stream(
            f"SELECT {columns} FROM enrichment_users WHERE cityHash64(asid) % 100 IN ({in_clause}){limit_clause}",
            settings={"max_block_size": 1000000},
        )
        column_names = rows_stream.source.column_names

        return rows_stream, column_names

    def get_lookalike(self, lookalike_id: UUID) -> AudienceLookalikes | None:
        return self.lookalikes.get_lookalike(lookalike_id)

    def process_lookalike_pipeline(
        self, audience_lookalike: AudienceLookalikes
    ):
        """
        Processes a lookalike

        This method fetches a user profiles from source and trains a catboost regression model

        Source scripts should have matched uploaded .csv files with our IDGraph and have calculated value_score for each matched user

        Details on value_score calculations are in source scripts. value_score is a float in 0..1 range

        We train regression into that value_score

        (gender, income_range, age, ...) -> value_score


        So here we fetch which fields should be used for training,
        Get data from clickhouse using those column names
        Train the model on profile data

        Use that trained model on each user in IDGraph and save users with top scores
        """
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

        logger.info(f"is fitted: {model.is_fitted()}")
        logger.info(str(model))

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
    ) -> CatBoostRegressor:
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
        top_n: int = lookalike.size

        BULK_SIZE = get_int_env("LOOKALIKE_BULK_SIZE")
        thread_count = get_int_env("LOOKALIKE_THREAD_COUNT")

        LOOKALIKE_MAX_SIZE = try_get_int_env("LOOKALIKE_MAX_SIZE")
        limit = self.get_lookalike_limit(
            thread_count=thread_count, total_limit=LOOKALIKE_MAX_SIZE
        )

        value_by_asid: dict[UUID, float] = {
            asid: float(val)
            for val, asid in self.profile_fetcher.get_value_and_user_asids(
                self.db, lookalike.source_uuid
            )
        }
        users_count = self.enrichment_users.count()

        dataset_size = LOOKALIKE_MAX_SIZE if LOOKALIKE_MAX_SIZE else users_count

        self.lookalikes.prepare_lookalike_size(
            lookalike_id=lookalike_id, dataset_size=dataset_size
        )

        rows_stream, column_names = self.get_enrichment_users(
            significant_fields=significant_fields
        )

        count = 0
        batch_buffer = []

        top_scores: list[PersonScore] = []

        config = self.audiences_scores.prepare_config(lookalike_id)
        

        buckets = self.get_buckets(thread_count)

        with ProcessPoolExecutor(max_workers=thread_count) as executor:
            futures: list[Future[list[PersonScore]]] = []

            for bucket in buckets:
                future = executor.submit(
                    filler_worker,
                    significant_fields=significant_fields,
                    config=config,
                    value_by_asid=value_by_asid,
                    lookalike_id=lookalike_id,
                    bucket=bucket,
                    top_n=top_n,
                    model=model,
                    limit=limit,
                )

                futures.append(future)

            for future in as_completed(futures):
                scores = future.result()

                top_scores = self.audiences_scores.top_scores(
                    old_scores=top_scores,
                    new_scores=scores,
                    top_n=top_n,
                )

                logging.info(f"sort done")
            logging.info("done")

        logging.info("running clickhouse query")

        # strange multiprocessing issue, clickhouse client is 'locked' by concurrent client, but this code block should execute synchronously..
        # so i re-init the client
        self.clickhouse = ClickhouseConfig.get_client()
        _ = self.clickhouse.command("SET max_query_size = 20485760")
        self.enrichment_scores.bulk_insert(
            lookalike_id=lookalike_id, scores=top_scores
        )
        self.db_workaround(lookalike_id=lookalike_id)

    def filler_worker(
        self,
        significant_fields: dict,
        config: NormalizationConfig,
        value_by_asid: dict[UUID, float],
        lookalike_id: UUID,
        bucket: list[int],
        top_n: int,
        model: CatBoostRegressor,
        limit: int | None = None,
    ) -> list[PersonScore]:
        db = next(get_db())
        BULK_SIZE: int = get_int_env("LOOKALIKE_BULK_SIZE")

        rows_stream, column_names = self.get_enrichment_users_partition(
            significant_fields=significant_fields,
            bucket=bucket,
            limit=limit,
        )

        batch_buffer = []

        top_scores: list[PersonScore] = []

        _ = db.execute(
            update(AudienceLookalikes)
            .where(AudienceLookalikes.id == lookalike_id)
            .values(processed_train_model_size=0)
        )
        db.commit()

        fetch_start = time.perf_counter()

        with rows_stream:
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

                if len(batch_buffer) < BULK_SIZE:
                    continue

                fetch_end = time.perf_counter()
                logger.info(f"fetch time: {fetch_end - fetch_start:.3f}")

                prepare_asids_start = time.perf_counter()
                asids: list[UUID] = [doc["asid"] for doc in batch_buffer]
                prepare_asids_end = time.perf_counter()

                logger.info(
                    f"prepare asids time: {prepare_asids_end - prepare_asids_start:.3f}"
                )

                times, scores = self.audiences_scores.calculate_batch_scores_v3(
                    asids,
                    batch_buffer,
                    model,
                    config,
                    lookalike_id,
                )

                logger.info(f"batch calculation time: {times:.3f}")

                update_query = (
                    update(AudienceLookalikes)
                    .where(AudienceLookalikes.id == lookalike_id)
                    .values(
                        processed_train_model_size=AudienceLookalikes.processed_train_model_size
                        + len(scores),
                        processed_size=AudienceLookalikes.processed_size
                        + len(scores),
                    )
                    .returning(AudienceLookalikes.processed_train_model_size)
                )

                processed = db.execute(update_query).scalar()
                db.commit()

                logger.info(f"processed: {processed}")

                top_scores = self.audiences_scores.top_scores(
                    old_scores=top_scores,
                    new_scores=scores,
                    top_n=top_n,
                )

                logging.info(f"sorted scores")

                batch_buffer = []
                fetch_start = time.perf_counter()

        return top_scores

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
        self.clickhouse.command("SET max_query_size = 20485760")
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
        self, channel, lookalike_id: UUID, user_id: int
    ):
        await self.rabbit.inform_lookalike_agent(
            channel=channel, lookalike_id=lookalike_id, user_id=user_id
        )

    def get_lookalike_limit(
        self, thread_count: int, total_limit: int | None
    ) -> int | None:
        if total_limit is not None:
            limit = total_limit // thread_count
        else:
            limit = None

        return limit


LookalikeFillerService = injectable(LookalikeFillerServiceBase)
