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
    """
    Глобальный handler, который буферизует сообщения по entity_id (из contextvar).
    Flush выполняется вручную через .start_entity() / .end_entity().
    """

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
                "ts": datetime.fromtimestamp(
                    record.created, tz=timezone.utc
                ).isoformat(),
                "level": record.levelname,
                "logger": record.name,
                "message": self.format(record),
                "module": record.module,
                "funcName": record.funcName,
                "lineno": record.lineno,
                "extra": {
                    k: v
                    for k, v in record.__dict__.items()
                    if k not in logging.LogRecord.__dict__
                },
            }

            print("before lock")

            # with self.lock:
            # print("start")
            buf = self.buffers.setdefault(str(entity_id), [])
            # print("in lock", buf)
            buf.append(entry)
            buf_len = len(buf)

            # print("in lock before", buf_len, buf_len % 50)
            if buf_len % 50 == 0 or buf_len < 5:
                # печатаем каждые 50 сообщений и первые пару сообщений
                print(
                    f"[EntityBufferHandler.emit] buffered {buf_len} messages for entity={entity_id}"
                )
                logging.getLogger(__name__).debug(
                    "Buffered %d messages for entity=%s", buf_len, entity_id
                )
            if len(buf) > 10000:
                self.buffers[entity_id] = buf[-5000:]
                print(
                    f"[EntityBufferHandler.emit] buffer truncated for entity={entity_id}, now {len(self.buffers[entity_id])}"
                )
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
            # fallback write for debugging
            try:
                with open(
                    "/tmp/app_entity_logs_failed.insert", "a", encoding="utf-8"
                ) as f:
                    f.write(
                        json.dumps(
                            {
                                "row": {
                                    "ts": str(end_ts),
                                    "script_name": meta["script_name"],
                                    "entity_id": str(entity_id),
                                    "user_id": meta["user_id"],
                                    "start_ts": str(start_ts),
                                    "end_ts": str(end_ts),
                                    "duration_ms": duration_ms,
                                    "status": status,
                                    # store messages length to avoid huge file
                                    "messages_count": len(buf),
                                }
                            },
                            ensure_ascii=False,
                        )
                        + "\n"
                    )
                print(
                    f"[EntityBufferHandler.end_entity] fallback written to /tmp/app_entity_logs_failed.insert for entity={entity_id}"
                )
            except Exception as fe:
                print(
                    f"[EntityBufferHandler.end_entity] fallback write failed: {fe}"
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

    # helpers for debugging
    def buffer_len(self, entity_id: str) -> int:
        with self.lock:
            return len(self.buffers.get(str(entity_id), []))

    def active_entities(self) -> List[str]:
        with self.lock:
            return list(self.buffers.keys())
