import argparse
import asyncio
import logging
import sys
import time
from datetime import datetime, timezone, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from resolver import Resolver
from db_dependencies import AsyncDb
from models.users_domains import UserDomains
from services.etl.leads import orchestrator


def setup_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run autonomous delivr ETL sync loop"
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run a single slot and exit (otherwise runs forever)",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=5,
        help="Max concurrent pixels to process",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run without writing into ClickHouse",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose (DEBUG) logs",
    )
    return parser.parse_args(argv)


async def _fetch_active_pixel_ids(session: AsyncSession) -> list[str]:
    """Fetch enabled domains' pixel IDs asynchronously, deduplicated."""
    stmt = (
        select(UserDomains.pixel_id)
        .where(UserDomains.is_enable.is_(True))
        .where(UserDomains.pixel_id.isnot(None))
    )
    res = await session.execute(stmt)
    raw_ids = [pid for pid in res.scalars().all() if pid is not None]
    pixel_ids: list[str] = []
    for pid in raw_ids:
        try:
            pixel_ids.append(str(pid))
        except Exception:
            continue
    # Deduplicate while preserving order
    seen = set()
    out: list[str] = []
    for pid in pixel_ids:
        if pid not in seen:
            seen.add(pid)
            out.append(pid)
    return out


def _seconds_until_next_run_10_40(now_utc: datetime | None = None) -> float:
    """Seconds until the next UTC time at :10 or :40 minutes.

    Examples:
    - 12:03 -> sleep until 12:10
    - 12:25 -> sleep until 12:40
    - 12:45 -> sleep until 13:10
    """
    now = now_utc or datetime.now(timezone.utc)
    minute = now.minute
    if minute < 10:
        target = now.replace(minute=10, second=0, microsecond=0)
    elif minute < 40:
        target = now.replace(minute=40, second=0, microsecond=0)
    else:
        # next hour :10
        next_hour = (now + timedelta(hours=1)).replace(
            minute=10, second=0, microsecond=0
        )
        # ensure hour increment correctly when crossing day/month/year
        target = next_hour
    delta = (target - now).total_seconds()
    # If we landed exactly on target (rare), set to next window (30 min)
    if delta <= 0:
        # Jump to next slot target
        if target.minute == 10:
            target = target.replace(minute=40)
        else:
            target = (target + timedelta(hours=1)).replace(minute=10)
        delta = (target - now).total_seconds()
    return float(delta)


async def _process_slot(
    pixel_ids: list[str], *, concurrency: int, dry_run: bool
) -> None:
    logger = logging.getLogger("delivr_sync")
    logger.info("Starting slot processing for %d pixels", len(pixel_ids))

    sem = asyncio.Semaphore(max(1, concurrency))

    async def _run_one(pid: str):
        async with sem:
            try:
                await orchestrator.run(pid, dry_run=dry_run)
                logger.info("Pixel processed: %s", pid)
            except Exception:
                logger.exception("Pixel failed: %s", pid)

    tasks = [asyncio.create_task(_run_one(pid)) for pid in pixel_ids]
    if tasks:
        await asyncio.gather(*tasks)
    logger.info("Slot processing finished")


async def main_async(argv: list[str]) -> int:
    args = parse_args(argv)
    setup_logging(args.verbose)
    logger = logging.getLogger("delivr_sync")

    logger.info(
        "Starting autonomous delivr_sync: once=%s concurrency=%s dry_run=%s",
        args.once,
        args.concurrency,
        args.dry_run,
    )

    resolver = Resolver()

    try:
        while True:
            started_at = time.time()
            session: AsyncSession = await resolver.resolve(AsyncDb)
            try:
                pixel_ids = await _fetch_active_pixel_ids(session)
            finally:
                try:
                    await session.close()
                except Exception:
                    pass

            if not pixel_ids:
                logger.warning(
                    "No active pixel_ids found in users_domains; nothing to process"
                )
            else:
                await _process_slot(
                    pixel_ids,
                    concurrency=args.concurrency,
                    dry_run=args.dry_run,
                )

            elapsed = time.time() - started_at
            logger.info("Slot completed in %.2fs", elapsed)

            if args.once:
                logger.info("--once flag set: exiting after single slot")
                return 0

            sleep_sec = _seconds_until_next_run_10_40()
            # Ensure a minimum small sleep to avoid tight loops if clock aligns exactly
            sleep_sec = max(1.0, sleep_sec)
            logger.info("Sleeping %.0fs until next :10/:40 run", sleep_sec)
            await asyncio.sleep(sleep_sec)
    except KeyboardInterrupt:
        logger.info("Interrupted by user, exiting")
        return 0
    except Exception:
        logger.exception("Autonomous delivr_sync crashed")
        return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main_async(sys.argv[1:])))
