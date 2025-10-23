import logging
import threading
import json
from datetime import datetime, timezone
from typing import Optional, Dict, List, Any
from contextvars import ContextVar
from db_dependencies import Clickhouse

_current_entity: ContextVar[Optional[str]] = ContextVar(
    "_current_entity", default=None
)


def get_current_entity_id() -> Optional[str]:
    return _current_entity.get()


class EntityBufferHandler(logging.Handler):
    def __init__(self, ch_client: Clickhouse, table: str):
        super().__init__()
        self.ch = ch_client
        self.table = table
        self.lock = threading.Lock()
        self.buffers: Dict[str, List[Dict[str, Any]]] = {}
        self.meta: Dict[str, Dict[str, Any]] = {}

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

        except Exception as exc:
            try:
                self.handleError(record)
            except Exception as e:
                logging.getLogger(__name__).exception(
                    "[EntityBufferHandler.emit] handleError failed: %s", e
                )

    def start_entity(
        self, entity_id: str, script_name: str, user_id: Optional[int] = None
    ) -> None:
        token = _current_entity.set(entity_id)
        with self.lock:
            self.buffers.setdefault(str(entity_id), [])
            self.meta[entity_id] = {
                "script_name": script_name,
                "user_id": user_id,
                "start_ts": datetime.now(timezone.utc),
                "context_token": token,
            }

    def end_entity(self, entity_id: str, status: str = "complete") -> None:
        with self.lock:
            buf = self.buffers.pop(str(entity_id), [])
            meta = self.meta.pop(entity_id, None)

        if not meta:
            return

        if "context_token" in meta:
            _current_entity.reset(meta["context_token"])

        start_ts = meta["start_ts"]
        end_ts = datetime.now(timezone.utc)
        duration_ms = int((end_ts - start_ts).total_seconds() * 1000)

        if not buf and status == "complete":
            return

        messages_json = json.dumps(buf, ensure_ascii=False)
        row_tuple = (
            end_ts,
            meta["script_name"],
            str(entity_id),
            meta["user_id"],
            start_ts,
            end_ts,
            duration_ms,
            status,
            messages_json,
        )

        try:
            (
                self.ch.insert(
                    self.table,
                    [row_tuple],
                    [
                        "ts",
                        "script_name",
                        "entity_id",
                        "user_id",
                        "start_ts",
                        "end_ts",
                        "duration_ms",
                        "status",
                        "messages",
                    ],
                ),
            )
        except Exception as e:
            logging.getLogger(__name__).exception(
                "ClickHouse insert failed: %s", e
            )

    def abort_entity(self, entity_id: str) -> None:
        with self.lock:
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
