import logging

from services.etl.leads.sessionizer import build_visits
from services.etl.leads.windows import resolve_window
from services.etl.leads.aggregations import aggregate_users
from persistence.delivr.client import AsyncDelivrClickHouseClient
from persistence.delivr.raw_events_repo import RawEventsRepository
from persistence.delivr.leads_visits_repo import LeadsVisitsRepository
from persistence.delivr.leads_users_repo import LeadsUsersRepository


async def run(pixel_id: str, *, dry_run: bool = False):
    logger = logging.getLogger("delivr_sync")
    window = resolve_window()
    logger.info(
        "Resolved window: read_from=%s read_to=%s slot_start=%s slot_end=%s",
        window.read_from,
        window.read_to,
        window.slot_start,
        window.slot_end,
    )

    ch = await AsyncDelivrClickHouseClient().connect()
    try:
        raw_events_repo = RawEventsRepository(ch)
        visits_repo = LeadsVisitsRepository(ch)
        users_repo = LeadsUsersRepository(ch)

        logger.info("Fetching raw events for pixel_id=%s", pixel_id)
        events = await raw_events_repo.fetch_events_async(
            pixel_id,
            window.read_from,
            window.read_to,
        )
        logger.info("Fetched %d events", len(events))

        visits = build_visits(events)
        # Keep only visits that start in the current slot to avoid overlap dupes
        visits = [
            v
            for v in visits
            if window.slot_start <= v.visit_start < window.slot_end
        ]
        logger.info("Built %d visits for slot", len(visits))

        if not dry_run:
            await visits_repo.insert_async(visits)
            logger.info("Inserted %d visits into ClickHouse", len(visits))
        else:
            logger.info("Dry-run enabled: skipping visits insert")

        users = aggregate_users(visits)
        logger.info("Aggregated %d users", len(users))

        if not dry_run:
            await users_repo.insert_async(users)
            logger.info("Inserted %d users into ClickHouse", len(users))
        else:
            logger.info("Dry-run enabled: skipping users insert")
    except Exception:
        logger.exception("ETL run failed for pixel_id=%s", pixel_id)
        raise
    finally:
        await ch.close()


async def run_historical_by_intervals(
    pixel_id: str,
    intervals: list[tuple],
    *,
    dry_run: bool = False,
    parquet_paths: list[str] | None = None,
):
    """
    Загрузка исторических данных для pixel_id по заданным временным интервалам.
    intervals = [(time_from1, time_to1), (time_from2, time_to2), ...]
    Если parquet_paths передан, читаем именно эти файлы вместо автоматической генерации путей по дням.
    """
    logger = logging.getLogger("delivr_sync")

    ch = await AsyncDelivrClickHouseClient().connect()
    try:
        raw_events_repo = RawEventsRepository(ch)
        visits_repo = LeadsVisitsRepository(ch)
        users_repo = LeadsUsersRepository(ch)

        for time_from, time_to in intervals:
            logger.info(
                "Fetching historical events for pixel_id=%s from %s to %s",
                pixel_id,
                time_from,
                time_to,
            )

            events = await raw_events_repo.fetch_events_async(
                pixel_id,
                time_from,
                time_to,
                parquet_paths=parquet_paths,
            )
            logger.info(
                "Fetched %d events for interval %s - %s",
                len(events),
                time_from,
                time_to,
            )

            if not events:
                continue

            visits = build_visits(events)
            logger.info(
                "Built %d visits for interval %s - %s",
                len(visits),
                time_from,
                time_to,
            )

            if not dry_run:
                await visits_repo.insert_async(visits)
                logger.info("Inserted %d visits into ClickHouse", len(visits))
            else:
                logger.info("Dry-run enabled: skipping visits insert")

            users = aggregate_users(visits)
            logger.info(
                "Aggregated %d users for interval %s - %s",
                len(users),
                time_from,
                time_to,
            )

            if not dry_run:
                await users_repo.insert_async(users)
                logger.info("Inserted %d users into ClickHouse", len(users))
            else:
                logger.info("Dry-run enabled: skipping users insert")

    except Exception:
        logger.exception("Historical ETL run failed for pixel_id=%s", pixel_id)
        raise
    finally:
        await ch.close()
