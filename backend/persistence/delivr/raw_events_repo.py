import json
import logging
import re
from datetime import datetime, timezone
from pathlib import Path

from config.clickhouse import ClickhouseConfig
from services.etl.leads.windows import Window

FILENAME_RE = re.compile(r"events_(\d+)_(\d+)\.parquet")


class RawEventsRepository:
    def __init__(self, ch_client):
        self.ch = ch_client

    def _build_parquet_paths(self, pixel_id: str, window: Window) -> list[str]:
        slot_start_ms = int(window.slot_start.timestamp() * 1000)
        slot_end_ms = int(window.slot_end.timestamp() * 1000)

        mid = slot_start_ms + 15 * 60 * 1000

        day = window.slot_start.date().isoformat()

        return [
            f"downloaded/events/pixel_id={pixel_id}/day={day}/events_{slot_start_ms}_{mid}.parquet",
            f"downloaded/events/pixel_id={pixel_id}/day={day}/events_{mid}_{slot_end_ms}.parquet",
        ]

    async def fetch_events_async(
        self,
        pixel_id: str,
        window: Window,
        parquet_paths: list[str] | None = None,
    ) -> list[dict]:
        logger = logging.getLogger("delivr_sync")
        delivr_table = ClickhouseConfig.delivr_table()

        if parquet_paths is None:
            parquet_paths = self._build_parquet_paths(pixel_id, window)

        logger.debug(
            "Parquet paths for pixel_id=%s: %s", pixel_id, parquet_paths
        )

        selects = []
        for p in parquet_paths:
            selects.append(
                f"""
                    SELECT *
                    FROM file(
                        '{p}',
                        'Parquet',
                        'timestamp String,
                         event_type String,
                         event_data Nullable(String),
                         client_ip Nullable(String),
                         ip Nullable(String),
                         hem Nullable(String),
                         md5_lc_hem Nullable(String),
                         profile_pid_all Nullable(String),
                         resolved Nullable(Bool)'
                    )
                    WHERE resolved = 1
                    """
            )

        files_sql = (
            " UNION ALL ".join(selects)
            if selects
            else "SELECT * FROM system.one WHERE 0"
        )

        sql_events = f"""
        SELECT *
        FROM ({files_sql}) AS e
        """

        try:
            events_rows = await self.ch.query(sql_events)
        except Exception as exc:
            msg = str(exc)

            if (
                "INCORRECT_DATA" in msg
                or "ParquetV3BlockInputFormat" in msg
                or "Row group 0 has <= 0 rows" in msg
                or "FILE_DOESNT_EXIST" in msg
            ):
                logger.warning(
                    "Skipping parquet files for pixel_id=%s due to invalid/missing parquet: %s",
                    pixel_id,
                    msg,
                )
                return []
            raise

        emails = {r["hem"] for r in events_rows if r.get("hem")}
        users_map = {}
        if emails:
            CHUNK_SIZE = 50_000
            emails_list = list(emails)
            for i in range(0, len(emails_list), CHUNK_SIZE):
                chunk = emails_list[i : i + CHUNK_SIZE]
                placeholders = ", ".join(f"'{e}'" for e in chunk)
                sql_users = f"""
                SELECT
                    any(profile_pid_all) AS profile_pid_all,
                    any(company_id) AS company_id,
                    arrayJoin(emails_sha256_lc_hem) AS email_sha256
                FROM {delivr_table}
                WHERE email_sha256 IN ({placeholders})
                GROUP BY email_sha256
                """
                user_rows = await self.ch.query(sql_users)
                for u in user_rows:
                    users_map[u["email_sha256"]] = {
                        "profile_pid_all": u.get("profile_pid_all"),
                        "company_id": u.get("company_id"),
                    }

        out: list[dict] = []
        for r in events_rows:
            raw = r.get("event_data")
            event_data = {}
            if isinstance(raw, (bytes, bytearray)):
                try:
                    raw = raw.decode("utf-8", errors="replace")
                except Exception:
                    raw = None
            if isinstance(raw, str) and raw:
                try:
                    event_data = json.loads(raw)
                except Exception as ex:
                    logger.debug(
                        "Failed to parse event_data; defaulting to {}. err=%s raw_prefix=%r",
                        ex,
                        raw[:200] if isinstance(raw, str) else raw,
                    )

            sha = r.get("hem")
            user_info = users_map.get(sha, {})

            profile_pid_all = r.get("profile_pid_all") or user_info.get(
                "profile_pid_all"
            )

            if not profile_pid_all:
                logger.info("No profile_pid_all found, skipping")
                continue

            out.append(
                {
                    "pixel_id": pixel_id,
                    "timestamp": r["timestamp"],
                    "event_type": r["event_type"],
                    "event_data": event_data,
                    "client_ip": r.get("client_ip"),
                    "ip": r.get("ip"),
                    "sha256_lc_hem": sha,
                    "md5_lc_hem": r.get("md5_lc_hem"),
                    "profile_pid_all": profile_pid_all,
                    "company_id": user_info.get("company_id"),
                }
            )
        return out
