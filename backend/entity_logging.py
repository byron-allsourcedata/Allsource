import logging
import threading
import json
import time
from datetime import datetime, timezone
from typing import Optional, Dict, List, Any
from db_dependencies import ClickhouseInserter
from contextvars import ContextVar

# contextvar будет хранить текущий entity_id (UUID as str) для выполнения
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

    def __init__(self, ch_client: ClickhouseInserter, table: str):
        super().__init__()
        self.ch = ch_client
        self.table = table
        self.lock = threading.Lock()
        # buffers: entity_id -> list of dict(log_entry)
        self.buffers: Dict[str, List[Dict[str, Any]]] = {}
        # meta per entity (script_name, user_id, start_ts)
        self.meta: Dict[str, Dict[str, Any]] = {}

    def emit(self, record: logging.LogRecord) -> None:
        try:
            entity_id = get_current_entity_id()
            if not entity_id:
                # no current entity => ignore or collect into a global buffer if you want
                return

            # build dictionary entry
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
                # any extra you pass via `extra=...`
                "extra": {
                    k: v
                    for k, v in record.__dict__.items()
                    if k not in logging.LogRecord.__dict__
                },
            }

            with self.lock:
                buf = self.buffers.setdefault(entity_id, [])
                buf.append(entry)
                # optional: guard buffer size (avoid OOM) — truncate oldest if too large
                if len(buf) > 10000:
                    # keep only latest N
                    self.buffers[entity_id] = buf[-5000:]
        except Exception:
            # don't raise inside logging handler
            try:
                self.handleError(record)
            except Exception:
                pass

    def start_entity(
        self, entity_id: str, script_name: str, user_id: Optional[int] = None
    ) -> None:
        """
        Устанавливаем contextvar + инициализируем meta/buffer.
        """
        token = _current_entity.set(entity_id)
        with self.lock:
            if entity_id not in self.buffers:
                self.buffers[entity_id] = []
            self.meta[entity_id] = {
                "script_name": script_name,
                "user_id": user_id,
                "start_ts": datetime.now(timezone.utc),
                "context_token": token,
            }

    def end_entity(self, entity_id: str, status: str = "complete") -> None:
        """
        Собирает буфер по entity_id, вставляет в ClickHouse одну запись, очищает буфер и meta.
        Вызывается при успешном завершении обработки сущности.
        """
        with self.lock:
            buf = self.buffers.pop(entity_id, [])
            meta = self.meta.pop(entity_id, None)

        if not meta:
            # ничего не открывали — игнор
            return

        start_ts = meta["start_ts"]
        end_ts = datetime.now(timezone.utc)
        duration_ms = int((end_ts - start_ts).total_seconds() * 1000)

        if not buf and status == "complete":
            # если нет логов — можно не писать. Решение на ваше усмотрение.
            return

        # prepare row
        messages_json = json.dumps(buf, ensure_ascii=False)
        row = {
            "ts": end_ts,
            "script_name": meta["script_name"],
            "entity_id": entity_id,
            "user_id": meta["user_id"],
            "start_ts": start_ts,
            "end_ts": end_ts,
            "duration_ms": duration_ms,
            "status": status,
            "messages": messages_json,
        }

        # Insert: clickhouse-driver принимает list of tuples or list of dicts if columns specified
        try:
            # insert as a tuple matching table columns order
            self.ch.execute(
                f"INSERT INTO {self.table} (ts, script_name, entity_id, user_id, start_ts, end_ts, duration_ms, status, messages) VALUES",
                [
                    (
                        row["ts"],
                        row["script_name"],
                        row["entity_id"],
                        row["user_id"],
                        row["start_ts"],
                        row["end_ts"],
                        row["duration_ms"],
                        row["status"],
                        row["messages"],
                    )
                ],
            )
        except Exception as e:
            # fallback: записать в локальный файл, чтобы не терять (и логнуть)
            logging.getLogger(__name__).exception(
                "ClickHouse insert failed: %s", e
            )
            # try:
            #     with open("/tmp/app_entity_logs_failed.insert", "a", encoding="utf-8") as f:
            #         f.write(json.dumps(row, default=str, ensure_ascii=False) + "\n")
            # except Exception:
            #     pass

    def abort_entity(self, entity_id: str) -> None:
        """
        Если нужно отбросить буфер (например при KeyboardInterrupt) — используем abort.
        """
        with self.lock:
            self.buffers.pop(entity_id, None)
            meta = self.meta.pop(entity_id, None)
            # сброс contextvar (если токен храним — можно восстановить старый)
            if meta and "context_token" in meta:
                try:
                    _current_entity.reset(meta["context_token"])
                except Exception:
                    pass
