import logging
import statistics
import time
import csv
import os
import heapq
import tempfile
import traceback
from typing import Tuple, List, Dict, Any, TypedDict
from urllib3.exceptions import ProtocolError
from http.client import IncompleteRead

from sentry_sdk.metrics import distribution
from typing_extensions import deprecated

from concurrent.futures import Future, ProcessPoolExecutor, as_completed

from uuid import UUID
from clickhouse_connect.driver.common import StreamContext
from catboost import CatBoostRegressor
from sqlalchemy import update

from config.lookalikes import LookalikesConfig
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
from services.audience_insights import AudienceInsightsService
from services.lookalikes.lookalike_filler.rabbitmq import (
    RabbitLookalikesMatchingService,
)
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
        insights_service: AudienceInsightsService,
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
        self.insights_service = insights_service

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
        significant_fields: dict[str, str],
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

    def simple_partition_worker(
        self,
        column_names: List[str],
        bucket: List[int],
        limit: int | None,
        importance_pct: Dict[str, int],
        field_dist_map: Dict[str, Dict[str, int]],
        lookalike_id: str,
        top_n_per_worker: int,
        tmp_dir: str,
    ) -> Tuple[List[Dict[str, Any]], str, int]:
        """
        Worker runs in separate process.
        - Reads one partition using Clickhouse client.
        - Computes integer contribution per field and total_score.
        - Writes detailed CSV lines for this worker into tmp file.
        - Maintains top-N in min-heap and returns top_scores list (dicts with asid, score),
          path to tmp csv, and processed count.
        """
        client = ClickhouseConfig.get_client()
        in_clause = ",".join(str(x) for x in bucket)
        limit_clause = f" LIMIT {limit}" if limit else ""
        columns = ", ".join(["asid"] + column_names)
        query = f"SELECT {columns} FROM enrichment_users WHERE cityHash64(asid) % 100 IN ({in_clause}){limit_clause}"

        tmp_fd, tmp_path = tempfile.mkstemp(
            prefix=f"simple_{lookalike_id}_part_", dir=tmp_dir, suffix=".csv"
        )
        os.close(tmp_fd)  # we'll open by name
        csv_file = open(tmp_path, "w", newline="", encoding="utf-8")
        # prepare header
        fields = list(importance_pct.keys())
        csv_fieldnames = ["asid"]
        for f in fields:
            csv_fieldnames += [
                f"{f}_value",
                f"{f}_valpct",
                f"{f}_imp",
                f"{f}_contrib",
            ]
        csv_fieldnames.append("total_score")
        writer = csv.DictWriter(csv_file, fieldnames=csv_fieldnames)
        writer.writeheader()

        # local top-n heap
        min_heap: List[tuple[int, str]] = []

        def heap_push_local(asid: str, score: int):
            if len(min_heap) < top_n_per_worker:
                heapq.heappush(min_heap, (score, asid))
            else:
                if score > min_heap[0][0]:
                    heapq.heapreplace(min_heap, (score, asid))

        def get_value_pct_for_field(field: str, raw_value: str) -> int:
            if not raw_value:
                return 0
            v = str(raw_value).strip().lower()
            fd = field_dist_map.get(field, {})
            if not fd:
                return 0
            val_pct = fd.get(v)
            if val_pct is not None:
                return int(val_pct)
            simple = v.split(",")[0].split("/")[0].split("-")[0].strip()
            val_pct = fd.get(simple)
            if val_pct is not None:
                return int(val_pct)
            return int(fd.get("other", 0))

        processed = 0
        try:
            rows_stream = client.query_row_block_stream(
                query, settings={"max_block_size": 1000000}
            )
            column_names_from_stream = rows_stream.source.column_names
            with rows_stream:
                for block in rows_stream:
                    for row in block:
                        user = dict(zip(column_names_from_stream, row))
                        asid = user.get("asid")
                        if asid is None:
                            continue
                        total_score = 0
                        csv_row = {"asid": asid}
                        for f in fields:
                            # alias resolution similar to main code
                            raw_value = None
                            if f in user:
                                raw_value = user.get(f)
                            else:
                                if f.endswith("_name") and f[:-5] in user:
                                    raw_value = user.get(f[:-5])
                                elif f + "_name" in user:
                                    raw_value = user.get(f + "_name")
                                else:
                                    raw_value = user.get(f)
                            value_str = (
                                ""
                                if raw_value is None
                                else str(raw_value).strip()
                            )
                            val_pct = get_value_pct_for_field(f, value_str)
                            contrib = int(importance_pct[f]) * int(val_pct)
                            total_score += contrib
                            csv_row[f"{f}_value"] = value_str
                            csv_row[f"{f}_valpct"] = val_pct
                            csv_row[f"{f}_imp"] = importance_pct[f]
                            csv_row[f"{f}_contrib"] = contrib
                        csv_row["total_score"] = total_score
                        writer.writerow(csv_row)
                        heap_push_local(asid=str(asid), score=int(total_score))
                        processed += 1
        except (ProtocolError, IncompleteRead) as e:
            # return partial results but keep csv flushed
            writer.writerow({"asid": "STREAM_INTERRUPTED", "total_score": 0})
        except Exception:
            # log stack in worker stdout (captured by process logs)
            traceback.print_exc()
        finally:
            csv_file.flush()
            csv_file.close()

        # build top list from heap (largest first)
        top_scores_heap = sorted(min_heap, key=lambda x: x[0], reverse=True)
        top_scores = [
            {"asid": item[1], "score": int(item[0])} for item in top_scores_heap
        ]
        return top_scores, tmp_path, processed

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
        logger.info(
            f"Processing lookalike {audience_lookalike.id} with type={audience_lookalike.generation_type}"
        )

        if audience_lookalike.generation_type in ("simple_all", "simple_any"):
            logger.info("Using SIMPLE pipeline (no ML model)")
            return self.process_simple_pipeline(audience_lookalike)
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
        user_profiles: list[dict[str, str]],
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

    def process_simple_pipeline(self, audience_lookalike: AudienceLookalikes):
        """
        Parallel partitioned simple pipeline:
        - creates per-partition CSVs
        - collects top-N per partition and merges top-N global
        - concatenates partition CSVs into final /tmp/simple_lookalike_<id>.csv
        """
        logger.info(f"Simple pipeline for lookalike {audience_lookalike.id}")

        distribution = (
            self.insights_service.get_source_insights_for_lookalike(
                audience_lookalike.source_uuid
            )
            or {}
        )
        sig = audience_lookalike.significant_fields or {}
        if not sig:
            logger.warning("No significant_fields found, nothing to score.")
            return []

        # convert importances -> integer percents
        importance_pct: dict[str, int] = {}
        for f, v in sig.items():
            try:
                if isinstance(v, (float, int)) and float(v) <= 1.0:
                    pct = int(round(float(v) * 100))
                else:
                    pct = int(round(float(v)))
            except Exception:
                pct = 0
            importance_pct[f] = max(0, pct)
        importance_pct = {k: v for k, v in importance_pct.items() if v > 0}
        if not importance_pct:
            logger.warning(
                "All significant fields have zero importance after conversion."
            )
            return []

        logger.info(f"Field importance percents: {importance_pct}")

        # build field distribution map (same as worker expects)
        field_dist_map: dict[str, dict[str, int]] = {}
        for section_key in ("b2c", "b2b"):
            section = distribution.get(section_key, {}) or {}
            for group_name, group in section.items():
                if not isinstance(group, dict):
                    continue
                for field_name, field_values in group.items():
                    if not isinstance(field_values, dict):
                        continue
                    fd = field_dist_map.setdefault(field_name, {})
                    for val_k, val_v in field_values.items():
                        try:
                            pct_int = int(round(float(val_v)))
                        except Exception:
                            continue
                        fd[val_k.strip().lower()] = pct_int

        logger.debug(
            f"Built field distribution map for {len(field_dist_map)} fields"
        )

        # prepare column names once (use column_selector)
        column_names = self.column_selector.clickhouse_columns(
            list(importance_pct.keys())
        )

        # prepare parallel execution parameters
        THREAD_COUNT = LookalikesConfig.THREAD_COUNT
        buckets = self.get_buckets(THREAD_COUNT)
        LOOKALIKE_MAX_SIZE = LookalikesConfig.LOOKALIKE_MAX_SIZE
        limit = self.get_lookalike_limit(
            thread_count=THREAD_COUNT, total_limit=LOOKALIKE_MAX_SIZE
        )

        # compute top_n per worker (a bit larger to be safe)
        top_n_global = audience_lookalike.size or 1000
        top_n_per_worker = max(
            1000, (top_n_global // max(1, len(buckets))) + 100
        )

        tmp_dir = "/tmp"
        futures = []
        top_scores_combined: list[dict] = []

        with ProcessPoolExecutor(max_workers=len(buckets)) as executor:
            for bucket in buckets:
                fut = executor.submit(
                    self.simple_partition_worker,
                    column_names,
                    bucket,
                    limit,
                    importance_pct,
                    field_dist_map,
                    str(audience_lookalike.id),
                    top_n_per_worker,
                    tmp_dir,
                )
                futures.append(fut)

            # collect results
            tmp_files = []
            total_processed = 0
            for fut in as_completed(futures):
                try:
                    worker_top, tmp_path, processed = fut.result()
                    logger.info(
                        f"Worker done: {tmp_path}, processed={processed}, top_count={len(worker_top)}"
                    )
                    total_processed += processed
                    tmp_files.append(tmp_path)
                    # merge top lists into combined top (use audiences_scores.top_scores if available)
                    top_scores_combined = self.audiences_scores.top_scores(
                        old_scores=top_scores_combined,
                        new_scores=worker_top,
                        top_n=top_n_global,
                    )
                except Exception as e:
                    logger.exception("Worker failed: %s", e)

        logger.info(
            f"All workers finished. total_processed ~ {total_processed}"
        )

        # top_scores_combined is final top list (list of {"asid":..., "score":...})
        # persist top scores
        try:
            if top_scores_combined:
                self.enrichment_scores.bulk_insert(
                    lookalike_id=audience_lookalike.id,
                    scores=top_scores_combined,
                )
                logger.info(f"Inserted {len(top_scores_combined)} top scores")
            else:
                logger.warning("No top scores to insert")
        except Exception as e:
            logger.exception("Failed to bulk_insert simple scores: %s", e)
            raise

        # merge per-worker CSVs into final CSV (concatenate, keeping header once)
        output_path = f"/tmp/simple_lookalike_{audience_lookalike.id}.csv"
        try:
            with open(output_path, "w", newline="", encoding="utf-8") as out_f:
                header_written = False
                for tmp_path in tmp_files:
                    with open(tmp_path, "r", encoding="utf-8") as in_f:
                        for i, line in enumerate(in_f):
                            if i == 0 and header_written:
                                continue  # skip header line
                            out_f.write(line)
                    try:
                        os.remove(tmp_path)
                    except Exception:
                        logger.debug(f"Failed to remove temp file {tmp_path}")
            logger.info(f"Simple lookalike CSV merged to {output_path}")
        except Exception as e:
            logger.exception("Failed to merge CSV parts: %s", e)

        asids = [s["asid"] for s in top_scores_combined]
        logger.info(f"Simple lookalike done: {len(asids)} users scored")
        return self.enrichment_users.fetch_enrichment_user_ids(asids)

    # def process_simple_pipeline(self, audience_lookalike: AudienceLookalikes):
    #     """
    #     Simple Lookalike generation with integer scoring:
    #     score(user) = sum_over_fields( importance_pct(field) * value_pct_from_distribution(field, user_value) )
    #     Example: job:30, state:70; job.staff:60% -> contribution = 30 * 60 = 1800
    #     """
    #     logger.info(f"Simple pipeline for lookalike {audience_lookalike.id}")
    #
    #     # --- Get the source distribution (insights) ---
    #     distribution = self.insights_service.get_source_insights_for_lookalike(audience_lookalike.source_uuid) or {}
    #
    #     sig = audience_lookalike.significant_fields or {}
    #     if not sig:
    #         logger.warning("No significant_fields found, nothing to score.")
    #         return []
    #
    #     importance_pct: dict[str, int] = {}
    #     for f, v in sig.items():
    #         try:
    #             if isinstance(v, (float, int)) and float(v) <= 1.0:
    #                 pct = int(round(float(v) * 100))
    #             else:
    #                 pct = int(round(float(v)))
    #         except Exception:
    #             pct = 0
    #         importance_pct[f] = max(0, pct)
    #
    #     # remove zero-importance fields (no influence)
    #     importance_pct = {k: v for k, v in importance_pct.items() if v > 0}
    #     if not importance_pct:
    #         logger.warning("All significant fields have zero importance after conversion.")
    #         return []
    #
    #     logger.info(f"Field importance percents: {importance_pct}")
    #
    #     # field_dist_map[field] = { value_lower: int_percent, ..., "other": int_percent_if_exists }
    #     field_dist_map: dict[str, dict[str, int]] = {}
    #
    #     # distribution has structure { "b2c": { "personal_info": {...}, ... }, "b2b": { ... } }
    #     for section_key in ("b2c", "b2b"):
    #         section = distribution.get(section_key, {}) or {}
    #         for group_name, group in section.items():
    #             # group is dict of fields -> {value: percent}
    #             if not isinstance(group, dict):
    #                 continue
    #             for field_name, field_values in group.items():
    #                 if not isinstance(field_values, dict):
    #                     continue
    #                 # ensure map exists
    #                 fd = field_dist_map.setdefault(field_name, {})
    #                 for val_k, val_v in field_values.items():
    #                     try:
    #                         pct_int = int(round(float(val_v)))
    #                     except Exception:
    #                         continue
    #                     fd[val_k.strip().lower()] = pct_int
    #                 # keep any explicit "other" if exists (lowercased)
    #                 if "other" in fd and fd["other"] is not None:
    #                     # already set
    #                     pass
    #
    #     logger.debug(f"Built field distribution map for {len(field_dist_map)} fields")
    #
    #     # --- Получаем пользователей из ClickHouse (по колонкам significant_fields) ---
    #     rows_stream, column_names = self.get_enrichment_users(list(importance_pct.keys()))
    #     all_users = []
    #     with rows_stream:
    #         for block in rows_stream:
    #             for row in block:
    #                 all_users.append(dict(zip(column_names, row)))
    #
    #     logger.info(f"Loaded {len(all_users)} candidate users for simple scoring")
    #
    #     results_for_csv = []
    #     scores: list[dict] = []
    #     for user in all_users:
    #         total_score = 0
    #         field_details = {}
    #
    #         for field, imp_pct in importance_pct.items():
    #             raw_value = None
    #             if field in user:
    #                 raw_value = user.get(field)
    #             else:
    #                 if field.endswith("_name") and field[:-5] in user:
    #                     raw_value = user.get(field[:-5])
    #                 elif field + "_name" in user:
    #                     raw_value = user.get(field + "_name")
    #                 else:
    #                     raw_value = user.get(field)
    #
    #             if raw_value is None:
    #                 value_pct = 0
    #                 value_str = ""
    #             else:
    #                 value_str = str(raw_value).strip().lower()
    #                 fd = field_dist_map.get(field, {})
    #                 value_pct = fd.get(value_str)
    #                 if value_pct is None:
    #                     simple = value_str.split(",")[0].split("/")[0].split("-")[0].strip()
    #                     value_pct = fd.get(simple)
    #                 if value_pct is None:
    #                     value_pct = fd.get("other", 0)
    #
    #             contribution = imp_pct * int(value_pct)
    #             total_score += contribution
    #
    #             field_details[field] = {
    #                 "value": value_str,
    #                 "value_pct": value_pct,
    #                 "importance_pct": imp_pct,
    #                 "contribution": contribution,
    #             }
    #
    #         scores.append({"asid": user["asid"], "score": int(total_score)})
    #
    #         results_for_csv.append({
    #             "asid": user["asid"],
    #             **{f"{f}_value": d["value"] for f, d in field_details.items()},
    #             **{f"{f}_valpct": d["value_pct"] for f, d in field_details.items()},
    #             **{f"{f}_imp": d["importance_pct"] for f, d in field_details.items()},
    #             **{f"{f}_contrib": d["contribution"] for f, d in field_details.items()},
    #             "total_score": total_score,
    #         })
    #
    #     scores.sort(key=lambda x: x["score"], reverse=True)
    #     top_scores = scores[:audience_lookalike.size]
    #
    #     # --- Save results (bulk insert expects objects with 'asid' and 'score') ---
    #     try:
    #         self.enrichment_scores.bulk_insert(
    #             lookalike_id=audience_lookalike.id, scores=top_scores
    #         )
    #     except Exception as e:
    #         logger.exception("Failed to bulk_insert simple scores: %s", e)
    #         raise
    #
    #     output_path = f"/tmp/simple_lookalike_{audience_lookalike.id}.csv"
    #     try:
    #         os.makedirs(os.path.dirname(output_path), exist_ok=True)
    #         fieldnames = list(results_for_csv[0].keys()) if results_for_csv else ["asid", "total_score"]
    #         with open(output_path, "w", newline="") as csvfile:
    #             writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    #             writer.writeheader()
    #             writer.writerows(results_for_csv)
    #         logger.info(f"Simple lookalike CSV saved to {output_path} ({len(results_for_csv)} rows)")
    #     except Exception as e:
    #         logger.exception("Failed to save CSV for simple lookalike: %s", e)
    #
    #     asids = [s["asid"] for s in top_scores]
    #     logger.info(f"Simple lookalike done: {len(asids)} users scored")
    #     return self.enrichment_users.fetch_enrichment_user_ids(asids)

    def calculate_and_store_scores(
        self,
        model,
        lookalike_id: UUID,
    ):
        """
        Exception list is not exhaustive

        Raises `LookalikeNotFound`
        """
        lookalike = self.lookalikes.get_lookalike_unsafe(lookalike_id)
        significant_fields = lookalike.significant_fields
        top_n: int = lookalike.size

        THREAD_COUNT = LookalikesConfig.THREAD_COUNT
        LOOKALIKE_MAX_SIZE = LookalikesConfig.LOOKALIKE_MAX_SIZE

        limit = self.get_lookalike_limit(
            thread_count=THREAD_COUNT, total_limit=LOOKALIKE_MAX_SIZE
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

        top_scores: list[PersonScore] = []

        config = self.audiences_scores.prepare_config(lookalike_id)

        buckets = self.get_buckets(THREAD_COUNT)

        with ProcessPoolExecutor(max_workers=THREAD_COUNT) as executor:
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
        significant_fields: dict[str, str],
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

        _ = self.db.execute(
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
