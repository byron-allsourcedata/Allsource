import asyncio
import csv
import logging
import os
import sys
import random
import uuid
from typing import Any

current_dir = os.path.dirname(os.path.realpath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, os.pardir))
sys.path.append(parent_dir)

# Ваши зависимости
from db_dependencies import Db, Clickhouse
from resolver import Resolver
from persistence.plans_persistence import PlansPersistence
from persistence.user_subscriptions import UserSubscriptionsPersistence

# Попытка импортировать ClickhouseConfig для fallback (если он есть в модуле)
try:
    from db_dependencies import ClickhouseConfig
except Exception:
    ClickhouseConfig = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _execute_query_sync(client: Any, query: str):
    """
    Выполняет запрос на доступных у клиента интерфейсах.
    Возвращает список строк (кортежи) или список dict-like (если клиент так возвращает).
    """
    if hasattr(client, "execute"):
        return client.execute(query)
    if hasattr(client, "query"):
        # некоторые клиенты возвращают объект с .result_rows или непосредственно список
        res = client.query(query)
        # пробуем достать rows в разных вариантах
        if hasattr(res, "result_rows"):
            return list(res.result_rows)
        try:
            # возможно это списко-подобный объект
            return list(res)
        except Exception:
            return res
    if hasattr(client, "command"):
        return client.command(query)
    raise RuntimeError(
        "Не найден поддерживаемый метод выполнения запроса у клиента ClickHouse."
    )


async def fetch_rows_async(client: Any, query: str):
    # ClickHouse-клиенты обычно синхронные -> выполняем в потоке
    return await asyncio.to_thread(_execute_query_sync, client, query)


def write_csv(path: str, rows, header):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        for r in rows:
            # если row - dict-like
            if isinstance(r, dict):
                row = [r.get(h) for h in header]
            else:
                # предполагаем порядок полей как в запросе (последняя колонка - Lead Date)
                row = list(r)
            writer.writerow(row)


def make_invalid_row(row, idx: int):
    """
    Преобразует оригинальную строку (tuple или dict) в строку с явно несуществующим asid и email.
    Возвращает кортеж в порядке: first_name,last_name,asid,email,phone_number,up_id,Lead Date
    """
    # извлечь поля в порядке
    if isinstance(row, dict):
        first_name = row.get("first_name")
        last_name = row.get("last_name")
        asid = row.get("asid")
        email = row.get("email")
        phone_number = row.get("phone_number")
        up_id = row.get("up_id")
        lead_date = row.get("personal_email_last_seen")
    else:
        # ожидаем кортеж в том же порядке, как в запросе
        first_name, last_name, asid, email, phone_number, up_id, lead_date = row

    # Сделаем asid с меньшим числом цифр (4 цифры) - явно "короткий/несуществующий"
    short_asid = "".join(random.choices("0123456789", k=4))

    # Сделаем несуществующую почту (используем зарезервированный домен example.invalid)
    fake_email = f"no-email-{idx}-{uuid.uuid4().hex[:6]}@example.invalid"

    return (
        first_name,
        last_name,
        short_asid,
        fake_email,
        phone_number,
        up_id,
        lead_date,
    )


async def main():
    resolver = Resolver()

    client_clickhouse = None
    # Попытка 1: получить ClickHouse через Resolver (если ваш Resolver умеет разрешать Annotated зависимость)
    try:
        client_clickhouse = await resolver.resolve(Clickhouse)
        logger.info(
            "ClickHouse client resolved via Resolver.resolve(Clickhouse)."
        )
    except Exception as e:
        logger.info("Не удалось разрешить Clickhouse через Resolver: %s", e)

    # Попытка 2: fallback на ClickhouseConfig.get_client(), если он доступен в db_dependencies
    if client_clickhouse is None and ClickhouseConfig is not None:
        try:
            client_clickhouse = ClickhouseConfig.get_client()
            logger.info(
                "ClickHouse client obtained via ClickhouseConfig.get_client()."
            )
        except Exception as e:
            logger.error(
                "Не удалось получить ClickHouse client через ClickhouseConfig.get_client(): %s",
                e,
            )
            raise

    if client_clickhouse is None:
        raise RuntimeError(
            "Не удалось получить ClickHouse client. Проверьте db_dependencies и Resolver."
        )

    try:
        # 1) Любые 500 записей
        query1 = (
            "SELECT first_name, last_name, asid, personal_email, phone_mobile1, up_id, personal_email_last_seen "
            "FROM enrichment_users LIMIT 10000"
        )
        rows1 = await fetch_rows_async(client_clickhouse, query1)
        header = [
            "first_name",
            "last_name",
            "asid",
            "email",
            "phone_number",
            "up_id",
            "Lead Date",
        ]
        # Если rows1 содержит объекты-словари с ключом personal_email_last_seen, преобразуем при записи
        # Формируем записи в порядке header (Lead Date берётся из personal_email_last_seen)
        normalized_rows1 = []
        for r in rows1:
            if isinstance(r, dict):
                normalized_rows1.append(
                    (
                        r.get("first_name"),
                        r.get("last_name"),
                        r.get("asid"),
                        r.get("email"),
                        r.get("phone_number"),
                        r.get("up_id"),
                        r.get("personal_email_last_seen"),
                    )
                )
            else:
                # предполагаем, что r уже в нужном порядке: (first_name,last_name,asid,email,phone_number,up_id,personal_email_last_seen)
                normalized_rows1.append(r)

        out_path1 = os.path.join(current_dir, "enrichment_users_sample.csv")
        write_csv(out_path1, normalized_rows1, header)
        logger.info("Wrote %d rows to %s", len(normalized_rows1), out_path1)

        # 2) Ещё 100 записей, но с явными "несуществующими" asid и email
        # Берём OFFSET 100 чтобы не дублировать (если хотите случайные уникальные, можно использовать ORDER BY rand())
        query2 = (
            "SELECT first_name, last_name, asid, personal_email, phone_mobile1, up_id, personal_email_last_seen "
            "FROM enrichment_users LIMIT 100 OFFSET 100"
        )
        rows2 = await fetch_rows_async(client_clickhouse, query2)

        invalid_rows = []
        for idx, r in enumerate(rows2, start=1):
            invalid_rows.append(make_invalid_row(r, idx))

        out_path2 = os.path.join(current_dir, "enrichment_users_invalid.csv")
        write_csv(out_path2, invalid_rows, header)
        logger.info("Wrote %d invalid rows to %s", len(invalid_rows), out_path2)

    finally:
        # Закрываем клиент, если у него есть close()
        try:
            if client_clickhouse and hasattr(client_clickhouse, "close"):
                client_clickhouse.close()
                logger.info("ClickHouse client closed.")
        except Exception:
            pass

    logger.info("Done.")


if __name__ == "__main__":
    asyncio.run(main())
