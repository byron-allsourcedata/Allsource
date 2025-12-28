import asyncio
import logging
from config.clickhouse import ClickhouseConfig
from clickhouse_connect.driver.exceptions import OperationalError, DatabaseError


class AsyncDelivrClickHouseClient:
    def __init__(self):
        self._client = None

    async def connect(self, retries: int = 2, backoff_sec: float = 1.0):
        """Create async client with a short retry and ping for early failure.
        This avoids long hangs if ClickHouse is temporarily unavailable.
        """
        logger = logging.getLogger("delivr_sync")
        attempt = 0
        last_exc: Exception | None = None
        while attempt <= max(0, retries):
            try:
                self._client = await ClickhouseConfig.get_async_client()
                # quick health check to fail fast
                await self._client.command("SELECT 1")
                logger.debug(
                    "Connected to ClickHouse host=%s port=%s secure=%s",
                    ClickhouseConfig.host,
                    ClickhouseConfig.port,
                )
                return self
            except (OperationalError, DatabaseError, ConnectionError) as ex:
                last_exc = ex
                # Close partially created client
                try:
                    if self._client is not None:
                        await self._client.close()
                except Exception:
                    pass
                self._client = None
                if attempt >= retries:
                    break
                sleep = backoff_sec * (2**attempt)
                logger.warning(
                    "ClickHouse connect attempt %d failed: %s. Retrying in %.1fs",
                    attempt + 1,
                    ex,
                    sleep,
                )
                await asyncio.sleep(sleep)
            except Exception as ex:
                last_exc = ex
                try:
                    if self._client is not None:
                        await self._client.close()
                except Exception:
                    pass
                self._client = None
                if attempt >= retries:
                    break
                sleep = backoff_sec * (2**attempt)
                logging.getLogger("delivr_sync").warning(
                    "ClickHouse unexpected error on connect (attempt %d): %s. Retrying in %.1fs",
                    attempt + 1,
                    ex,
                    sleep,
                )
                await asyncio.sleep(sleep)
            finally:
                attempt += 1
        # Exhausted retries
        if last_exc:
            logger.error(
                "ClickHouse is unreachable (host=%s port=%s secure=%s): %s",
                ClickhouseConfig.host,
                ClickhouseConfig.port,
                last_exc,
            )
            raise last_exc
        raise RuntimeError(
            "Failed to initialize ClickHouse client for unknown reasons"
        )

    async def close(self):
        try:
            if self._client is not None:
                await self._client.close()
        except Exception:
            pass

    async def query(
        self,
        sql: str,
        params: dict | None = None,
        settings: dict | None = None,
    ) -> list[dict]:
        result = await self._client.query(
            sql,
            params or {},
            settings=settings or {},
        )
        if isinstance(result, list):
            return result
        else:
            cols = result.column_names
            return [
                {c: v for c, v in zip(cols, row)} for row in result.result_rows
            ]

    async def execute(self, sql: str, params: dict | None = None):
        return await self._client.command(sql, params or {})

    async def insert_dicts(
        self,
        table: str,
        rows: list[dict],
        settings: dict | None = None,
    ):
        if not rows:
            return

        cols = list(rows[0].keys())
        data = [[r.get(c) for c in cols] for r in rows]

        await self._client.insert(
            table,
            data,
            column_names=cols,
            settings=settings or {},
        )
