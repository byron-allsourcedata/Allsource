import logging
import time
from typing import Any, cast
from uuid import UUID

from catboost import CatBoostRegressor
from clickhouse_connect.driver.common import StreamContext
from pandas import DataFrame
from sqlalchemy import update

from config.clickhouse import ClickhouseConfig
from config.util import get_int_env
from db_dependencies import get_db
from models.audience_lookalikes import AudienceLookalikes
from schemas.similar_audiences import NormalizationConfig
from services.similar_audiences.audience_data_normalization import (
    AudienceDataNormalizationServiceBase,
)
from services.similar_audiences.column_selector import (
    AudienceColumnSelectorBase,
)
from services.similar_audiences.similar_audience_scores import (
    PersonScore,
    measure,
)

logger = logging.getLogger(__name__)


def calculate_score_batches(
    model: CatBoostRegressor,
    df: DataFrame,
    config: NormalizationConfig,
) -> list[float]:
    normalization_service = AudienceDataNormalizationServiceBase()
    df_normed, _ = normalization_service.normalize_dataframe(df, config)
    result = model.predict(
        df_normed, thread_count=get_int_env("LOOKALIKE_THREAD_COUNT")
    )
    return result.tolist()


def calculate_score_dict_batch(
    model: CatBoostRegressor,
    persons: list[dict[str, Any]],
    config: NormalizationConfig,
) -> list[float]:
    df = DataFrame(persons)
    return calculate_score_batches(model, df, config=config)


def calculate_batch_scores_v3(
    asids: list[UUID],
    batch: list[dict[str, Any]],
    model: CatBoostRegressor,
    config: NormalizationConfig,
) -> tuple[float, list[PersonScore]]:
    scores, duration = measure(
        lambda _: calculate_score_dict_batch(model, batch, config)
    )

    return duration, list(zip(asids, scores))


def get_top_scores(
    old_scores: list[tuple[UUID, float]],
    new_scores: list[tuple[UUID, float]],
    top_n: int,
) -> list[PersonScore]:
    combined = {}

    for uuid_, score in old_scores + new_scores:
        if uuid_ not in combined or score > combined[uuid_]:
            combined[uuid_] = score

    return sorted(combined.items(), key=lambda x: x[1], reverse=True)[:top_n]


def get_enrichment_users_partition(
    significant_fields: dict[str, float],
    bucket: list[int],
    limit: int | None = None,
) -> tuple[StreamContext, list[str]]:
    """
    Returns a stream of blocks of enrichment users and a list of column names for a partition
    """
    column_selector = AudienceColumnSelectorBase()

    column_names = column_selector.clickhouse_columns(significant_fields)

    columns = ", ".join(["asid"] + column_names)

    logger.info(f"bucket: {bucket}")

    in_clause = ",".join(f"{x}" for x in bucket)

    client = ClickhouseConfig.get_client()

    limit_clause = f" LIMIT {limit}" if limit else ""

    rows_stream = client.query_row_block_stream(
        f"SELECT {columns} FROM enrichment_users WHERE cityHash64(asid) % 100 IN ({in_clause}){limit_clause}",
        settings={"max_block_size": 1000000},
    )
    column_names: list[str] = cast(list[str], rows_stream.source.column_names)

    return rows_stream, column_names


def filler_worker(
    significant_fields: dict[str, float],
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

    rows_stream, column_names = get_enrichment_users_partition(
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

            times, scores = calculate_batch_scores_v3(
                asids,
                batch_buffer,
                model,
                config,
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

            top_scores = get_top_scores(
                old_scores=top_scores,
                new_scores=scores,
                top_n=top_n,
            )

            logging.info("sorted scores")

            batch_buffer = []
            fetch_start = time.perf_counter()

    return top_scores
