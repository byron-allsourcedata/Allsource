import asyncio
from domains.liveramp.service import LiverampService
from domains.liveramp.persistence.postgresql import PostgresPersistence
from domains.liveramp.persistence.clickhouse import ClickHousePersistence
from domains.liveramp.persistence.delivr_s3 import DelivrPersistence
from domains.liveramp.persistence.snowflake import SnowflakePersistence
from db_dependencies import Db, Clickhouse
from persistence.enrichment_users import EnrichmentUsersPersistence
from resolver import Resolver
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s.%(msecs)03d %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


async def main():
    resolver = Resolver()

    # Создаем все зависимости
    db_session = await resolver.resolve(Db)
    ch_client = await resolver.resolve(Clickhouse)

    postgres_persistence = PostgresPersistence(db=db_session)
    enrichment_users_persistence = EnrichmentUsersPersistence(
        clickhouse=ch_client
    )
    clickhouse_persistence = ClickHousePersistence(
        enrichment_users=enrichment_users_persistence, clickhouse=ch_client
    )
    delivr_persistence = DelivrPersistence(
        clickhouse_persistence=clickhouse_persistence
    )
    snowflake_persistence = SnowflakePersistence()

    service = LiverampService(
        postgres_persistence=postgres_persistence,
        clickhouse_persistence=clickhouse_persistence,
        delivr_persistence=delivr_persistence,
        snowflake_persistence=snowflake_persistence,
    )

    csv_content, statistics = await service.generate_combined_report()

    print(f"Processing statistics: {statistics}")

    service.save_csv_to_file(csv_content, "combined_data_report.csv")


if __name__ == "__main__":
    asyncio.run(main())
