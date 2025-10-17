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

        # immediate debug on init
        print(
            f"[EntityBufferHandler.__init__] table={table} ch_client={type(ch_client).__name__}"
        )
        logging.getLogger(__name__).debug(
            "EntityBufferHandler initialized for table=%s", table
        )

    def emit(self, record: logging.LogRecord) -> None:
        try:
            # сначала contextvar
            entity_id = get_current_entity_id()
            # fallback: если кто-то явно прокинул extra={'entity_id': ...}
            if not entity_id:
                entity_id = getattr(record, "entity_id", None)

            # debug: show when a record arrives to handler
            try:
                print(
                    f"[EntityBufferHandler.emit] record.level={record.levelname} logger={record.name} entity_id={entity_id} message_preview={str(record.getMessage())[:200]}"
                )
            except Exception:
                print(
                    "[EntityBufferHandler.emit] record arrived (preview failed)"
                )

            if not entity_id:
                # нет идентификатора сущности — игнорируем
                print(
                    "[EntityBufferHandler.emit] no entity_id found, ignoring record"
                )
                return

            entry = {
                "level": record.levelname,
                "message": record.message,
            }

            buf = self.buffers.setdefault(str(entity_id), [])
            buf.append(entry)

        except Exception as exc:
            print(f"[EntityBufferHandler.emit] exception: {exc}")
            try:
                self.handleError(record)
            except Exception as e:
                print(f"[EntityBufferHandler.emit] handleError failed: {e}")

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
        print(
            f"[EntityBufferHandler.start_entity] entity={entity_id} script={script_name} user_id={user_id}"
        )
        logging.getLogger(__name__).debug("start_entity for %s", entity_id)

    def end_entity(self, entity_id: str, status: str = "complete") -> None:
        print(
            f"[EntityBufferHandler.end_entity] called for entity={entity_id} status={status}"
        )
        logging.getLogger(__name__).debug(
            "end_entity called for %s status=%s", entity_id, status
        )

        with self.lock:
            buf = self.buffers.pop(str(entity_id), [])
            meta = self.meta.pop(entity_id, None)

        if not meta:
            print(
                f"[EntityBufferHandler.end_entity] no meta for entity={entity_id} -> ignoring"
            )
            return

        # restore previous contextvar if token present
        try:
            if "context_token" in meta:
                _current_entity.reset(meta["context_token"])
        except Exception as e:
            print(f"[EntityBufferHandler.end_entity] context reset failed: {e}")

        start_ts = meta["start_ts"]
        end_ts = datetime.now(timezone.utc)
        duration_ms = int((end_ts - start_ts).total_seconds() * 1000)

        print(
            f"[EntityBufferHandler.end_entity] collected {len(buf)} messages for entity={entity_id} duration_ms={duration_ms}"
        )

        if not buf and status == "complete":
            print(
                f"[EntityBufferHandler.end_entity] buffer empty and status=complete -> not inserting for entity={entity_id}"
            )
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
            print(
                f"[EntityBufferHandler.end_entity] inserting into ClickHouse table={self.table} for entity={entity_id}"
            )
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
            print(
                f"[EntityBufferHandler.end_entity] insert succeeded for entity={entity_id}"
            )
        except Exception as e:
            print(
                f"[EntityBufferHandler.end_entity] ClickHouse insert failed for entity={entity_id}: {e}"
            )
            logging.getLogger(__name__).exception(
                "ClickHouse insert failed: %s", e
            )

    def abort_entity(self, entity_id: str) -> None:
        print(
            f"[EntityBufferHandler.abort_entity] called for entity={entity_id}"
        )
        with self.lock:
            self.buffers.pop(str(entity_id), None)
            meta = self.meta.pop(entity_id, None)
            if meta and "context_token" in meta:
                try:
                    _current_entity.reset(meta["context_token"])
                except Exception as e:
                    print(
                        f"[EntityBufferHandler.abort_entity] context reset failed: {e}"
                    )
