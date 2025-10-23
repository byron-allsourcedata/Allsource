import asyncio
import logging
import json
from datetime import datetime, timezone
from typing import Optional, Dict, List, Any
from contextvars import ContextVar
from db_dependencies import ClickhouseInserter

_current_entity: ContextVar[Optional[str]] = ContextVar(
    "_current_entity", default=None
)


def get_current_entity_id() -> Optional[str]:
    return _current_entity.get()


class EntityBufferHandler(logging.Handler):
    def __init__(self, ch_async_client: ClickhouseInserter, table: str):
        super().__init__()
        self.async_client = ch_async_client
        self.table = table
        self.buffers: Dict[str, List[Dict[str, Any]]] = {}
        self.meta: Dict[str, Dict[str, Any]] = {}
        self._pending_tasks: Dict[str, asyncio.Task] = {}

    def emit(self, record: logging.LogRecord) -> None:
        try:
            entity_id = get_current_entity_id()
            if not entity_id:
                entity_id = getattr(record, "entity_id", None)

            if not entity_id:
                return

            entry = {
                "level": record.levelname,
                "message": record.message,
            }

            buf = self.buffers.setdefault(str(entity_id), [])
            buf.append(entry)

        except Exception as e:
            logging.getLogger(__name__).exception(
                "[EntityBufferHandler.emit] handleError failed: %s", e
            )

    def start_entity(
        self,
        script_name: str,
        entity_uuid_id: str | None = None,
        entity_int_id: int | None = None,
        user_id: Optional[int] = None,
    ) -> None:
        entity_id = (
            entity_uuid_id if entity_uuid_id is not None else str(entity_int_id)
        )
        token = _current_entity.set(entity_id)
        self.buffers.setdefault(entity_id, [])
        self.meta[entity_id] = {
            "script_name": script_name,
            "user_id": user_id,
            "start_ts": datetime.now(timezone.utc),
            "context_token": token,
        }

    def end_entity(
        self,
        entity_uuid_id: str | None = None,
        entity_int_id: int | None = None,
        status: str = "complete",
    ) -> None:
        entity_id = (
            entity_uuid_id if entity_uuid_id is not None else str(entity_int_id)
        )
        buf = self.buffers.pop(entity_id, [])
        meta = self.meta.pop(entity_id, None)

        if not meta:
            return

        if "context_token" in meta:
            _current_entity.reset(meta["context_token"])

        if not buf and status == "complete":
            return

        start_ts = meta["start_ts"]
        end_ts = datetime.now(timezone.utc)
        duration_ms = int((end_ts - start_ts).total_seconds() * 1000)

        messages_json = json.dumps(buf, ensure_ascii=False)
        row = (
            meta["script_name"],
            str(entity_uuid_id),
            entity_int_id,
            meta["user_id"],
            start_ts,
            end_ts,
            duration_ms,
            status,
            messages_json,
        )

        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and self.async_client:
            task = loop.create_task(self._do_insert(entity_id, row))
            self._pending_tasks[entity_id] = task

    async def _do_insert(self, entity_id: str, row_tuple):
        client = self.async_client
        try:
            await client.insert(
                self.table,
                [row_tuple],
                column_names=[
                    "script_name",
                    "entity_uuid_id",
                    "entity_int_id",
                    "user_id",
                    "start_ts",
                    "end_ts",
                    "duration_ms",
                    "status",
                    "messages",
                ],
            )
            logging.getLogger(__name__).debug("Inserted logs for %s", entity_id)
        except Exception:
            logging.getLogger(__name__).exception(
                "Async ClickHouse insert failed for %s", entity_id
            )
        finally:
            self._pending_tasks.pop(entity_id, None)

    async def flush_all(self, timeout: Optional[float] = 5.0):
        tasks = list(self._pending_tasks.values())
        remaining = list(self.buffers.items())
        self.buffers.clear()
        metas = self.meta.copy()
        self.meta.clear()

        for entity_id, buf in remaining:
            meta = metas.get(entity_id)
            if not meta:
                continue
            messages_json = json.dumps(buf, ensure_ascii=False)
            entity_uuid_id = entity_id if type(entity_id) is str else None
            entity_int_id = entity_id if type(entity_id) is int else None
            row_tuple = (
                meta["script_name"],
                str(entity_uuid_id),
                entity_int_id,
                meta["user_id"],
                meta["start_ts"],
                datetime.now(timezone.utc),
                int(
                    (
                        datetime.now(timezone.utc) - meta["start_ts"]
                    ).total_seconds()
                    * 1000
                ),
                "aborted",
                messages_json,
            )
            tasks.append(
                asyncio.create_task(self._do_insert(entity_id, row_tuple))
            )

        if not tasks:
            return

        await asyncio.wait(tasks, timeout=timeout)

    def abort_entity(
        self,
        entity_uuid_id: str | None = None,
        entity_int_id: int | None = None,
    ) -> None:
        entity_id = (
            entity_uuid_id if entity_uuid_id is not None else str(entity_int_id)
        )
        self.buffers.pop(str(entity_id), None)
        meta = self.meta.pop(entity_id, None)
        if meta and "context_token" in meta:
            try:
                _current_entity.reset(meta["context_token"])
            except Exception as e:
                logging.getLogger(__name__).exception(
                    "[EntityBufferHandler.abort_entity] context reset failed: %s",
                    e,
                )
